import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { analyzeResume } from "./ats.js";
import { connectToDatabase } from "./mongo.js";
import { Resume } from "./models/Resume.js";
import { User } from "./models/User.js";
import { templates } from "./templates.js";
import { compactText, normalizeResumePayload, resumeToText } from "./resumeUtils.js";

const app = express();
const port = process.env.PORT || 3001;
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 30;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function createPasswordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createTokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
}

async function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = createTokenHash(token);
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  user.sessions = [
    ...(user.sessions ?? []).filter((session) => session.expiresAt > new Date()),
    { tokenHash, expiresAt }
  ].slice(-5);

  await user.save();
  return token;
}

async function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return response.status(401).json({ message: "Необходима авторизация." });
  }

  const tokenHash = createTokenHash(token);
  const user = await User.findOne({ "sessions.tokenHash": tokenHash });

  if (!user) {
    return response.status(401).json({ message: "Сессия не найдена." });
  }

  const now = new Date();
  const session = user.sessions.find((item) => item.tokenHash === tokenHash && item.expiresAt > now);

  if (!session) {
    user.sessions = user.sessions.filter((item) => item.expiresAt > now && item.tokenHash !== tokenHash);
    await user.save();
    return response.status(401).json({ message: "Сессия истекла." });
  }

  request.user = user;
  request.tokenHash = tokenHash;
  return next();
}

async function attachLegacyResume(ownerId) {
  const ownedCount = await Resume.countDocuments({ ownerId });

  if (ownedCount > 0) {
    return;
  }

  const legacyResume = await Resume.findOne({
    $or: [{ ownerId: null }, { ownerId: { $exists: false } }]
  }).sort({ updatedAt: -1 });

  if (!legacyResume) {
    return;
  }

  legacyResume.ownerId = ownerId;
  legacyResume.title = legacyResume.title || legacyResume.name || "Мое резюме";
  await legacyResume.save();
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/templates", (_request, response) => {
  response.json({ templates });
});

app.post(
  "/api/auth/register",
  asyncHandler(async (request, response) => {
    const name = compactText(request.body?.name);
    const email = normalizeEmail(request.body?.email);
    const password = String(request.body?.password ?? "");

    if (!name || !email || password.length < 6) {
      return response.status(400).json({
        message: "Укажи имя, email и пароль не короче 6 символов."
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response.status(409).json({ message: "Пользователь с таким email уже существует." });
    }

    const passwordSalt = crypto.randomBytes(16).toString("hex");
    const passwordHash = createPasswordHash(password, passwordSalt);
    const user = await User.create({ name, email, passwordHash, passwordSalt });
    const token = await createSession(user);

    return response.status(201).json({ token, user: sanitizeUser(user) });
  })
);

app.post(
  "/api/auth/login",
  asyncHandler(async (request, response) => {
    const email = normalizeEmail(request.body?.email);
    const password = String(request.body?.password ?? "");
    const user = await User.findOne({ email });

    if (!user || createPasswordHash(password, user.passwordSalt) !== user.passwordHash) {
      return response.status(401).json({ message: "Неверный email или пароль." });
    }

    const token = await createSession(user);
    return response.json({ token, user: sanitizeUser(user) });
  })
);

app.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({ user: sanitizeUser(request.user) });
  })
);

app.post(
  "/api/auth/logout",
  requireAuth,
  asyncHandler(async (request, response) => {
    request.user.sessions = request.user.sessions.filter((session) => session.tokenHash !== request.tokenHash);
    await request.user.save();
    response.json({ ok: true });
  })
);

app.get(
  "/api/resumes",
  requireAuth,
  asyncHandler(async (request, response) => {
    await attachLegacyResume(request.user._id);

    const resumes = await Resume.find({ ownerId: request.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    response.json({ resumes });
  })
);

app.get(
  "/api/resumes/latest",
  requireAuth,
  asyncHandler(async (request, response) => {
    await attachLegacyResume(request.user._id);

    const resume = await Resume.findOne({ ownerId: request.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    response.json({ resume });
  })
);

app.get(
  "/api/resumes/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const resume = await Resume.findOne({
      _id: request.params.id,
      ownerId: request.user._id
    }).lean();

    if (!resume) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    return response.json({ resume });
  })
);

app.post(
  "/api/resumes",
  requireAuth,
  asyncHandler(async (request, response) => {
    const normalizedResume = normalizeResumePayload(request.body ?? {});
    let resume = null;

    if (request.body?._id && mongoose.isValidObjectId(request.body._id)) {
      resume = await Resume.findOneAndUpdate(
        { _id: request.body._id, ownerId: request.user._id },
        normalizedResume,
        { new: true, runValidators: true }
      );
    }

    if (!resume) {
      resume = await Resume.create({
        ...normalizedResume,
        ownerId: request.user._id
      });
    }

    return response.json({ resume });
  })
);

app.post(
  "/api/resumes/:id/duplicate",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const source = await Resume.findOne({
      _id: request.params.id,
      ownerId: request.user._id
    }).lean();

    if (!source) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const { _id, createdAt, updatedAt, analysisHistory, ...copy } = source;
    const resume = await Resume.create({
      ...copy,
      title: `${source.title || source.name || "Резюме"} (копия)`,
      analysisHistory: []
    });

    return response.status(201).json({ resume });
  })
);

app.delete(
  "/api/resumes/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const deleted = await Resume.findOneAndDelete({
      _id: request.params.id,
      ownerId: request.user._id
    });

    if (!deleted) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    return response.json({ ok: true });
  })
);

app.post(
  "/api/resumes/:id/analyze",
  requireAuth,
  asyncHandler(async (request, response) => {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const vacancyText = compactText(request.body?.vacancyText);

    if (vacancyText.length < 20) {
      return response.status(400).json({
        message: "Недостаточно текста вакансии для ATS-анализа."
      });
    }

    const resume = await Resume.findOne({
      _id: request.params.id,
      ownerId: request.user._id
    });

    if (!resume) {
      return response.status(404).json({ message: "Резюме не найдено." });
    }

    const result = analyzeResume(resumeToText(resume), vacancyText);
    resume.analysisHistory = [
      {
        score: result.score,
        verdict: result.verdict,
        matchedKeywords: result.matchedKeywords,
        missingKeywords: result.missingKeywords,
        recommendations: result.recommendations,
        vacancyText
      },
      ...(resume.analysisHistory ?? [])
    ].slice(0, 10);

    await resume.save();

    return response.json({
      ...result,
      history: resume.analysisHistory
    });
  })
);

app.post("/api/analyze", (request, response) => {
  const { resumeText = "", vacancyText = "" } = request.body ?? {};

  if (compactText(vacancyText).length < 20) {
    return response.status(400).json({
      message: "Недостаточно текста вакансии для ATS-анализа."
    });
  }

  const result = analyzeResume(resumeText, vacancyText);
  return response.json(result);
});

app.use("/api", (_request, response) => {
  response.status(404).json({ message: "Маршрут не найден." });
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      return next();
    }

    return response.sendFile(path.join(clientDistPath, "index.html"));
  });
}

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Внутренняя ошибка сервера." });
});

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function startServer() {
  let attempt = 1;

  while (true) {
    try {
      await connectToDatabase();
      app.listen(port, () => {
        console.log(`Сервер запущен: http://localhost:${port}`);
      });
      return;
    } catch (error) {
      console.error(`Database connection failed (attempt ${attempt}):`, error.message);
      attempt += 1;
      await delay(5000);
    }
  }
}

startServer();
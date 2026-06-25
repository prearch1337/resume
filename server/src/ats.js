const keywordDictionary = [
  {
    key: "javascript",
    label: "JavaScript",
    weight: 5,
    patterns: [/\bjavascript\b/i, /\bjava\s*script\b/i, /\bjs\b/i]
  },
  {
    key: "typescript",
    label: "TypeScript",
    weight: 5,
    patterns: [/\btypescript\b/i, /\btype\s*script\b/i, /\bts\b/i]
  },
  {
    key: "react",
    label: "React",
    weight: 5,
    patterns: [/\breact\b/i, /\breact\.js\b/i]
  },
  {
    key: "vue",
    label: "Vue.js",
    weight: 4,
    patterns: [/\bvue\b/i, /\bvue\.js\b/i]
  },
  {
    key: "nodejs",
    label: "Node.js",
    weight: 5,
    patterns: [/\bnode\s*\.?\s*js\b/i, /\bnodejs\b/i]
  },
  {
    key: "express",
    label: "Express",
    weight: 4,
    patterns: [/\bexpress\b/i, /\bexpress\.js\b/i]
  },
  {
    key: "mongodb",
    label: "MongoDB",
    weight: 5,
    patterns: [/\bmongodb\b/i, /\bmongo\s*db\b/i]
  },
  {
    key: "mongoose",
    label: "Mongoose",
    weight: 4,
    patterns: [/\bmongoose\b/i]
  },
  {
    key: "html",
    label: "HTML",
    weight: 4,
    patterns: [/\bhtml\b/i]
  },
  {
    key: "css",
    label: "CSS",
    weight: 4,
    patterns: [/\bcss\b/i]
  },
  {
    key: "restapi",
    label: "REST API",
    weight: 4,
    patterns: [/\brest\s*api\b/i, /\brestful\b/i, /\bapi\b/i]
  },
  {
    key: "git",
    label: "Git",
    weight: 4,
    patterns: [/\bgit\b/i]
  },
  {
    key: "github",
    label: "GitHub",
    weight: 3,
    patterns: [/\bgithub\b/i]
  },
  {
    key: "pdf",
    label: "PDF",
    weight: 4,
    patterns: [/\bpdf\b/i, /\bjspdf\b/i, /pdf-документ\w*/i]
  },
  {
    key: "ats",
    label: "ATS",
    weight: 4,
    patterns: [/\bats\b/i, /автоматизированн\w*\s+систем\w*\s+отбор\w*/i]
  },
  {
    key: "frontend",
    label: "Frontend",
    weight: 4,
    patterns: [/\bfront\s*-?\s*end\b/i, /\bfrontend\b/i, /фронтенд\w*/i, /клиентск\w*\s+част\w*/i]
  },
  {
    key: "backend",
    label: "Backend",
    weight: 3,
    patterns: [/\bback\s*-?\s*end\b/i, /\bbackend\b/i, /бэкенд\w*/i, /серверн\w*\s+част\w*/i]
  },
  {
    key: "ui",
    label: "Пользовательский интерфейс",
    weight: 3,
    patterns: [/\bui\b/i, /пользовательск\w*\s+интерфейс\w*/i, /интерфейс\w*/i]
  },
  {
    key: "forms",
    label: "Работа с формами",
    weight: 3,
    patterns: [/\bforms?\b/i, /форм\w*/i]
  },
  {
    key: "responsive",
    label: "Адаптивная верстка",
    weight: 3,
    patterns: [/\bresponsive\b/i, /адаптивн\w*\s+верстк\w*/i, /адаптивн\w*\s+интерфейс\w*/i]
  },
  {
    key: "validation",
    label: "Валидация данных",
    weight: 3,
    patterns: [/\bvalidation\b/i, /валид\w*/i, /провер\w*\s+данн\w*/i]
  },
  {
    key: "database",
    label: "База данных",
    weight: 3,
    patterns: [/\bdatabase\b/i, /баз\w*\s+данн\w*/i, /\bбд\b/i]
  },
  {
    key: "auth",
    label: "Авторизация",
    weight: 3,
    patterns: [/\bauth\b/i, /авторизац\w*/i, /регистрац\w*/i, /аутентификац\w*/i]
  },
  {
    key: "preview",
    label: "Предпросмотр",
    weight: 2,
    patterns: [/preview/i, /предпросмотр\w*/i]
  },
  {
    key: "templates",
    label: "Шаблоны резюме",
    weight: 2,
    patterns: [/template/i, /шаблон\w*/i]
  },
  {
    key: "resume",
    label: "Резюме",
    weight: 2,
    patterns: [/resume/i, /резюме/i]
  },
  {
    key: "webapp",
    label: "Веб-приложение",
    weight: 2,
    patterns: [/web\s*application/i, /веб-приложен\w*/i, /интерактивн\w*\s+сервис\w*/i]
  }
];

const equivalentSkills = {
  database: ["mongodb", "mongoose"],
  frontend: ["javascript", "typescript", "react", "html", "css"],
  backend: ["nodejs", "express"],
  restapi: ["express", "backend"],
  git: ["github"],
  github: ["git"],
  pdf: ["jspdf"],
  webapp: ["frontend", "backend", "react", "nodejs", "express"],
  ui: ["frontend", "react", "html", "css", "forms"],
  validation: ["forms"],
  ats: ["resume", "pdf"]
};

function normalizeText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»]/g, '"')
    .replace(/node\s+js/g, "node.js")
    .replace(/mongo\s+db/g, "mongodb")
    .replace(/rest\s+api/g, "rest api");
}

function hasPattern(source, patterns) {
  return patterns.some((pattern) => pattern.test(source));
}

function addKeyword(result, term) {
  if (!result.has(term.key)) {
    result.set(term.key, {
      key: term.key,
      label: term.label,
      weight: term.weight
    });
  }
}

export function extractKeywords(text) {
  const source = normalizeText(text);
  const result = new Map();

  for (const term of keywordDictionary) {
    if (hasPattern(source, term.patterns)) {
      addKeyword(result, term);
    }
  }

  if (result.has("restapi")) {
    result.delete("api");
  }

  return [...result.values()].sort(
    (left, right) => right.weight - left.weight || left.label.localeCompare(right.label, "ru")
  );
}

function resumeMatchesKeyword(keyword, resumeKeys) {
  if (resumeKeys.has(keyword.key)) {
    return true;
  }

  const equivalents = equivalentSkills[keyword.key] ?? [];
  return equivalents.some((key) => resumeKeys.has(key));
}

function buildRecommendations(score, missingKeywords, resumeText, vacancyText) {
  const recommendations = [];

  if (missingKeywords.length) {
    recommendations.push(
      `Добавить или явно указать в резюме релевантные навыки: ${missingKeywords.slice(0, 6).join(", ")}.`
    );
  }

  if (score < 80 && String(resumeText).length < 500) {
    recommendations.push(
      "Расширить описание опыта и проектов: указать задачи, использованные технологии и результат работы."
    );
  }

  if (
    /\bgit\b|\bgithub\b/i.test(vacancyText) &&
    !/\bgit\b|\bgithub\b/i.test(resumeText) &&
    !missingKeywords.includes("Git") &&
    !missingKeywords.includes("GitHub")
  ) {
    recommendations.push("Указать опыт работы с Git или GitHub, если такой навык действительно есть.");
  }

  if (
    /адаптивн\w*\s+верстк\w*|\bresponsive\b/i.test(vacancyText) &&
    !/адаптивн\w*\s+верстк\w*|\bresponsive\b/i.test(resumeText) &&
    !missingKeywords.includes("Адаптивная верстка")
  ) {
    recommendations.push("Добавить информацию об адаптивной верстке, если она использовалась в проекте.");
  }

  if (!recommendations.length) {
    recommendations.push(
      "Сохранить текущую структуру резюме и адаптировать формулировки под конкретную вакансию."
    );
  }

  return [...new Set(recommendations)];
}

export function analyzeResume(resumeText, vacancyText) {
  const vacancyKeywords = extractKeywords(vacancyText);
  const resumeKeywords = extractKeywords(resumeText);
  const resumeKeys = new Set(resumeKeywords.map((keyword) => keyword.key));

  const matched = vacancyKeywords.filter((keyword) => resumeMatchesKeyword(keyword, resumeKeys));
  const missing = vacancyKeywords.filter((keyword) => !resumeMatchesKeyword(keyword, resumeKeys));

  const matchedKeywords = matched.map((keyword) => keyword.label);
  const missingKeywords = missing.map((keyword) => keyword.label).slice(0, 8);

  const totalWeight = vacancyKeywords.reduce((sum, keyword) => sum + keyword.weight, 0);
  const matchedWeight = matched.reduce((sum, keyword) => sum + keyword.weight, 0);

  const score = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  let verdict = "Резюме требует доработки";
  if (!vacancyKeywords.length) {
    verdict = "Добавьте более подробный текст вакансии для анализа";
  } else if (score >= 80) {
    verdict = "Резюме хорошо соответствует вакансии";
  } else if (score >= 55) {
    verdict = "Соответствие среднее, есть точки роста";
  }

  const recommendations = buildRecommendations(score, missingKeywords, resumeText, vacancyText);

  return {
    score,
    verdict,
    matchedKeywords,
    missingKeywords,
    recommendations,
    checkedAt: new Date().toISOString()
  };
}


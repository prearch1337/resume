import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true, default: "" },
    degree: { type: String, trim: true, default: "" },
    period: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    period: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    link: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const analysisHistorySchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    verdict: { type: String, trim: true, default: "" },
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    vacancyText: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null
    },
    title: { type: String, trim: true, default: "Новое резюме" },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    links: {
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" }
    },
    jobTitle: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    education: { type: [educationSchema], default: [] },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    experience: { type: [experienceSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certificates: { type: [certificateSchema], default: [] },
    analysisHistory: { type: [analysisHistorySchema], default: [] },
    status: { type: String, enum: ["draft", "ready"], default: "draft" },
    template: { type: String, default: "classic" }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);

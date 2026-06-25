import { templates } from "./templates.js";

export function compactText(value) {
  return String(value ?? "").trim();
}

export function compactArray(items, mapper) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object")
    .map(mapper)
    .filter((item) => Object.values(item).some(Boolean));
}

export function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(compactText).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map(compactText)
    .filter(Boolean);
}

export function normalizeResumePayload(payload = {}) {
  return {
    title: compactText(payload.title) || compactText(payload.name) || "Новое резюме",
    name: compactText(payload.name) || "Без имени",
    email: compactText(payload.email),
    phone: compactText(payload.phone),
    address: compactText(payload.address),
    links: {
      linkedin: compactText(payload.links?.linkedin),
      github: compactText(payload.links?.github),
      website: compactText(payload.links?.website)
    },
    jobTitle: compactText(payload.jobTitle),
    summary: compactText(payload.summary),
    education: compactArray(payload.education, (item) => ({
      institution: compactText(item.institution),
      degree: compactText(item.degree),
      period: compactText(item.period)
    })),
    skills: normalizeStringArray(payload.skills),
    languages: normalizeStringArray(payload.languages),
    experience: compactArray(payload.experience, (item) => ({
      company: compactText(item.company),
      position: compactText(item.position),
      period: compactText(item.period),
      description: compactText(item.description)
    })),
    projects: compactArray(payload.projects, (item) => ({
      name: compactText(item.name),
      description: compactText(item.description),
      link: compactText(item.link)
    })),
    certificates: compactArray(payload.certificates, (item) => ({
      title: compactText(item.title),
      issuer: compactText(item.issuer),
      year: compactText(item.year)
    })),
    status: payload.status === "ready" ? "ready" : "draft",
    template: templates.some((template) => template.id === payload.template) ? payload.template : "classic"
  };
}

export function resumeToText(resume) {
  return [
    resume.title,
    resume.name,
    resume.email,
    resume.phone,
    resume.address,
    resume.links?.linkedin,
    resume.links?.github,
    resume.links?.website,
    resume.jobTitle,
    resume.summary,
    ...(resume.education ?? []).flatMap((item) => [item.institution, item.degree, item.period]),
    ...(resume.skills ?? []),
    ...(resume.languages ?? []),
    ...(resume.experience ?? []).flatMap((item) => [
      item.company,
      item.position,
      item.period,
      item.description
    ]),
    ...(resume.projects ?? []).flatMap((item) => [item.name, item.description, item.link]),
    ...(resume.certificates ?? []).flatMap((item) => [item.title, item.issuer, item.year])
  ]
    .filter(Boolean)
    .join(" ");
}

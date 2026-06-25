export const emptyEducation = { institution: "", degree: "", period: "" };
export const emptyExperience = { company: "", position: "", period: "", description: "" };
export const emptyProject = { name: "", description: "", link: "" };
export const emptyCertificate = { title: "", issuer: "", year: "" };

export function createEmptyResume() {
  return {
    _id: "",
    title: "Новое резюме",
    name: "",
    email: "",
    phone: "",
    address: "",
    links: {
      linkedin: "",
      github: "",
      website: ""
    },
    jobTitle: "",
    summary: "",
    education: [{ ...emptyEducation }],
    skills: "",
    languages: "",
    experience: [{ ...emptyExperience }],
    projects: [{ ...emptyProject }],
    certificates: [{ ...emptyCertificate }],
    analysisHistory: [],
    status: "draft",
    template: "classic"
  };
}

function ensureArray(value, fallback) {
  return Array.isArray(value) && value.length ? value : [{ ...fallback }];
}

export function mapApiResumeToForm(data) {
  if (!data) {
    return createEmptyResume();
  }

  return {
    _id: data._id ?? "",
    title: data.title ?? data.name ?? "Новое резюме",
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    links: {
      linkedin: data.links?.linkedin ?? "",
      github: data.links?.github ?? "",
      website: data.links?.website ?? ""
    },
    jobTitle: data.jobTitle ?? "",
    summary: data.summary ?? "",
    education: ensureArray(data.education, emptyEducation),
    skills: Array.isArray(data.skills) ? data.skills.join(", ") : data.skills ?? "",
    languages: Array.isArray(data.languages) ? data.languages.join(", ") : data.languages ?? "",
    experience: ensureArray(data.experience, emptyExperience),
    projects: ensureArray(data.projects, emptyProject),
    certificates: ensureArray(data.certificates, emptyCertificate),
    analysisHistory: Array.isArray(data.analysisHistory) ? data.analysisHistory : [],
    status: data.status ?? "draft",
    template: data.template ?? "classic"
  };
}

export function splitList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function filterFilled(items) {
  return items.filter((item) => Object.values(item).some((value) => String(value ?? "").trim()));
}

export function mapFormToApiResume(resume) {
  return {
    _id: resume._id || undefined,
    title: resume.title,
    name: resume.name,
    email: resume.email,
    phone: resume.phone,
    address: resume.address,
    links: resume.links,
    jobTitle: resume.jobTitle,
    summary: resume.summary,
    education: filterFilled(resume.education),
    skills: splitList(resume.skills),
    languages: splitList(resume.languages),
    experience: filterFilled(resume.experience),
    projects: filterFilled(resume.projects),
    certificates: filterFilled(resume.certificates),
    status: resume.status,
    template: resume.template
  };
}

export function joinLines(items, formatter) {
  return items.map(formatter).filter(Boolean);
}

export function validateResume(resume) {
  const errors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+\d\s().-]{6,}$/;

  if (!resume.name.trim()) {
    errors.name = "Укажи имя для резюме.";
  }

  if (!resume.email.trim()) {
    errors.email = "Email нужен для контактов.";
  } else if (!emailPattern.test(resume.email.trim())) {
    errors.email = "Проверь формат email.";
  }

  if (resume.phone.trim() && !phonePattern.test(resume.phone.trim())) {
    errors.phone = "Телефон должен содержать цифры и допустимые символы.";
  }

  if (!resume.jobTitle.trim()) {
    errors.jobTitle = "Укажи желаемую должность.";
  }

  if (splitList(resume.skills).length < 3) {
    errors.skills = "Добавь минимум три навыка через запятую.";
  }

  return errors;
}


export function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

import { useEffect, useMemo, useState } from "react";
import { API_URL, TOKEN_KEY } from "./api.js";
import { ArraySection, Field, KeywordGroup, ResumePreview } from "./components.jsx";
import { exportResumePdf } from "./pdfExport.js";
import {
  createEmptyResume,
  emptyCertificate,
  emptyEducation,
  emptyExperience,
  emptyProject,
  formatDate,
  joinLines,
  mapApiResumeToForm,
  mapFormToApiResume,
  splitList,
  validateResume
} from "./resumeUtils.js";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [resume, setResume] = useState(createEmptyResume);
  const [vacancyText, setVacancyText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function apiRequest(path, options = {}) {
    const authToken = options.authToken ?? token;
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && authToken === token) {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
      }

      throw new Error(payload.message || "Не удалось выполнить запрос.");
    }

    return payload;
  }

  async function loadTemplates() {
    const payload = await fetch(`${API_URL}/api/templates`).then((response) => response.json());
    setTemplates(payload.templates ?? []);
  }

  async function loadResumes(authToken = token, preferredId = activeId) {
    const payload = await apiRequest("/api/resumes", { authToken });
    const loadedResumes = payload.resumes ?? [];
    setResumes(loadedResumes);

    if (!loadedResumes.length) {
      const blank = createEmptyResume();
      setActiveId("");
      setResume(blank);
      setAnalysis(null);
      return blank;
    }

    const selected =
      loadedResumes.find((item) => item._id === preferredId) ??
      loadedResumes[0];

    setActiveId(selected._id);
    setResume(mapApiResumeToForm(selected));
    setAnalysis(null);
    return selected;
  }

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");

      try {
        await loadTemplates();

        if (token) {
          const payload = await apiRequest("/api/auth/me", { authToken: token });
          setUser(payload.user);
          await loadResumes(token);
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validation = useMemo(() => validateResume(resume), [resume]);

  const previewSections = useMemo(() => {
    return {
      contacts: [resume.email, resume.phone, resume.address].filter(Boolean),
      links: [resume.links.linkedin, resume.links.github, resume.links.website].filter(Boolean),
      education: joinLines(resume.education, (item) =>
        [item.institution, item.degree, item.period].filter(Boolean).join(", ")
      ),
      skills: splitList(resume.skills),
      languages: splitList(resume.languages),
      experience: joinLines(resume.experience, (item) =>
        [item.company, item.position, item.period, item.description].filter(Boolean).join(" - ")
      ),
      projects: joinLines(resume.projects, (item) =>
        [item.name, item.description, item.link].filter(Boolean).join(" - ")
      ),
      certificates: joinLines(resume.certificates, (item) =>
        [item.title, item.issuer, item.year].filter(Boolean).join(", ")
      )
    };
  }, [resume]);


  function updateField(field, value) {
    setResume((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function updateLink(field, value) {
    setResume((current) => ({
      ...current,
      links: { ...current.links, [field]: value }
    }));
    setMessage("");
  }

  function updateArray(section, index, field, value) {
    setResume((current) => {
      const items = [...current[section]];
      items[index] = { ...items[index], [field]: value };
      return { ...current, [section]: items };
    });
    setMessage("");
  }

  function addArrayItem(section, item) {
    setResume((current) => ({
      ...current,
      [section]: [...current[section], { ...item }]
    }));
  }

  function removeArrayItem(section, index, fallback) {
    setResume((current) => {
      const items = current[section].filter((_, itemIndex) => itemIndex !== index);
      return { ...current, [section]: items.length ? items : [{ ...fallback }] };
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = await apiRequest(path, {
        method: "POST",
        authToken: "",
        body: authForm
      });

      localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
      setUser(payload.user);
      await loadResumes(payload.token);
      setMessage(authMode === "login" ? "Вход выполнен." : "Аккаунт создан.");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function logout() {
    try {
      if (token) {
        await apiRequest("/api/auth/logout", { method: "POST" });
      }
    } catch {
      // Сессия могла уже истечь на сервере.
    }

    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setResumes([]);
    setActiveId("");
    setResume(createEmptyResume());
    setAnalysis(null);
  }

  function createNewResume() {
    const blank = createEmptyResume();
    setActiveId("");
    setResume(blank);
    setAnalysis(null);
    setVacancyText("");
    setMessage("Создан черновик. Заполни данные и сохрани его в базе.");
    setError("");
  }

  function selectResume(selected) {
    setActiveId(selected._id);
    setResume(mapApiResumeToForm(selected));
    setAnalysis(null);
    setMessage("");
    setError("");
  }

  async function persistResume(options = {}) {
    const currentValidation = validateResume(resume);

    if (Object.keys(currentValidation).length) {
      setError("Исправь ошибки в форме перед сохранением.");
      throw new Error("Форма содержит ошибки.");
    }

    const payload = await apiRequest("/api/resumes", {
      method: "POST",
      body: mapFormToApiResume(resume)
    });

    const mappedResume = mapApiResumeToForm(payload.resume);
    setResume(mappedResume);
    setActiveId(payload.resume._id);
    setResumes((current) => {
      const rest = current.filter((item) => item._id !== payload.resume._id);
      return [payload.resume, ...rest].sort(
        (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
      );
    });

    if (!options.silent) {
      setMessage("Резюме сохранено в MongoDB.");
    }

    return payload.resume;
  }

  async function saveResume() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await persistResume();
    } catch (requestError) {
      if (requestError.message !== "Форма содержит ошибки.") {
        setError(requestError.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function duplicateResume() {
    if (!activeId) {
      setError("Сначала сохрани резюме, чтобы создать копию.");
      return;
    }

    setError("");
    const payload = await apiRequest(`/api/resumes/${activeId}/duplicate`, {
      method: "POST"
    });

    await loadResumes(token, payload.resume._id);
    setMessage("Копия резюме создана.");
  }

  async function deleteResume() {
    if (!activeId) {
      createNewResume();
      return;
    }

    const accepted = window.confirm("Удалить выбранное резюме?");
    if (!accepted) {
      return;
    }

    setError("");
    await apiRequest(`/api/resumes/${activeId}`, { method: "DELETE" });
    await loadResumes(token, "");
    setMessage("Резюме удалено.");
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError("");
    setMessage("");

    try {
      if (vacancyText.trim().length < 20) {
        throw new Error("Добавь текст вакансии минимум на 20 символов.");
      }

      const savedResume = await persistResume({ silent: true });
      const payload = await apiRequest(`/api/resumes/${savedResume._id}/analyze`, {
        method: "POST",
        body: { vacancyText }
      });

      setAnalysis(payload);
      setResume((current) => ({
        ...current,
        analysisHistory: payload.history ?? current.analysisHistory
      }));
      setResumes((current) =>
        current.map((item) =>
          item._id === savedResume._id
            ? { ...item, analysisHistory: payload.history ?? item.analysisHistory }
            : item
        )
      );
      setMessage("ATS-анализ выполнен и сохранен в истории.");
    } catch (requestError) {
      if (requestError.message !== "Форма содержит ошибки.") {
        setError(requestError.message);
      }
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function exportPdf() {
    try {
      await exportResumePdf(resume, previewSections);
    } catch (pdfError) {
      console.error("Не удалось сформировать PDF.", pdfError);
      setError("Не удалось сформировать PDF-файл.");
    }
  }

  if (!user) {
    return (
      <div className="auth-page">
        <section className="auth-card">
          <div>
            <p className="eyebrow">ATS Resume Builder</p>
            <h1>Интерактивный конструктор резюме</h1>
            <p className="auth-subtitle">
              Создание, хранение, ATS-анализ и экспорт резюме в PDF.
            </p>
          </div>

          <form className="auth-form" onSubmit={submitAuth}>
            <div className="auth-tabs" role="tablist" aria-label="Режим авторизации">
              <button
                type="button"
                className={authMode === "login" ? "tab active" : "tab"}
                onClick={() => setAuthMode("login")}
              >
                Вход
              </button>
              <button
                type="button"
                className={authMode === "register" ? "tab active" : "tab"}
                onClick={() => setAuthMode("register")}
              >
                Регистрация
              </button>
            </div>

            {authMode === "register" ? (
              <Field label="Имя">
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
            ) : null}

            <Field label="Email">
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
              />
            </Field>

            <Field label="Пароль">
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              />
            </Field>

            <button className="primary wide" type="submit">
              {authMode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>

          {loading ? <p className="message neutral">Загрузка...</p> : null}
          {error ? <p className="message error">{error}</p> : null}
          {message ? <p className="message success">{message}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="app-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">ATS Resume Builder</p>
          <h1>Конструктор резюме</h1>
        </div>
        <div className="topbar-actions">
          <span>{user.name}</span>
          <button className="ghost" onClick={logout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Мои резюме</h2>
            <button className="primary small" onClick={createNewResume}>
              Новое
            </button>
          </div>

          <div className="resume-list">
            {resumes.length ? (
              resumes.map((item) => (
                <button
                  key={item._id}
                  className={item._id === activeId ? "resume-item active" : "resume-item"}
                  onClick={() => selectResume(item)}
                >
                  <span>{item.title || item.name || "Без названия"}</span>
                  <small>
                    {item.status === "ready" ? "готово" : "черновик"} ·{" "}
                    {item.updatedAt ? formatDate(item.updatedAt) : "не сохранено"}
                  </small>
                </button>
              ))
            ) : (
              <p className="empty-list">Пока нет сохраненных резюме.</p>
            )}
          </div>

          <div className="sidebar-actions">
            <button className="secondary" onClick={duplicateResume} disabled={!activeId}>
              Создать копию
            </button>
            <button className="danger" onClick={deleteResume}>
              Удалить
            </button>
          </div>
        </aside>

        <section className="editor-panel">
          <div className="panel-title">
            <div>
              <h2>Данные резюме</h2>
              <p>Заполнение формы, валидация и сохранение в MongoDB</p>
            </div>
            <label className="status-toggle">
              <input
                type="checkbox"
                checked={resume.status === "ready"}
                onChange={(event) => updateField("status", event.target.checked ? "ready" : "draft")}
              />
              Готово к отправке
            </label>
          </div>

          <div className="form-grid">
            <Field label="Название резюме">
              <input value={resume.title} onChange={(event) => updateField("title", event.target.value)} />
            </Field>
            <Field label="Имя" error={validation.name}>
              <input value={resume.name} onChange={(event) => updateField("name", event.target.value)} />
            </Field>
            <Field label="Email" error={validation.email}>
              <input value={resume.email} onChange={(event) => updateField("email", event.target.value)} />
            </Field>
            <Field label="Телефон" error={validation.phone}>
              <input value={resume.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </Field>
            <Field label="Адрес">
              <input value={resume.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>
            <Field label="Должность" error={validation.jobTitle}>
              <input value={resume.jobTitle} onChange={(event) => updateField("jobTitle", event.target.value)} />
            </Field>
            <Field label="LinkedIn">
              <input value={resume.links.linkedin} onChange={(event) => updateLink("linkedin", event.target.value)} />
            </Field>
            <Field label="GitHub">
              <input value={resume.links.github} onChange={(event) => updateLink("github", event.target.value)} />
            </Field>
            <Field label="Сайт">
              <input value={resume.links.website} onChange={(event) => updateLink("website", event.target.value)} />
            </Field>
          </div>

          <Field label="Краткий профиль">
            <textarea
              rows="3"
              value={resume.summary}
              onChange={(event) => updateField("summary", event.target.value)}
              placeholder="Коротко опиши специализацию, сильные стороны и цель резюме"
            />
          </Field>

          <ArraySection
            title="Образование"
            actionLabel="Добавить образование"
            onAdd={() => addArrayItem("education", emptyEducation)}
          >
            {resume.education.map((item, index) => (
              <div className="repeat-row" key={`education-${index}`}>
                <input
                  placeholder="Учебное заведение"
                  value={item.institution}
                  onChange={(event) => updateArray("education", index, "institution", event.target.value)}
                />
                <input
                  placeholder="Специальность"
                  value={item.degree}
                  onChange={(event) => updateArray("education", index, "degree", event.target.value)}
                />
                <input
                  placeholder="Период"
                  value={item.period}
                  onChange={(event) => updateArray("education", index, "period", event.target.value)}
                />
                <button
                  className="icon-button"
                  title="Удалить образование"
                  onClick={() => removeArrayItem("education", index, emptyEducation)}
                >
                  ×
                </button>
              </div>
            ))}
          </ArraySection>

          <Field label="Навыки" error={validation.skills}>
            <textarea
              rows="3"
              value={resume.skills}
              onChange={(event) => updateField("skills", event.target.value)}
              placeholder="JavaScript, React, Node.js, MongoDB"
            />
          </Field>

          <Field label="Языки">
            <input
              value={resume.languages}
              onChange={(event) => updateField("languages", event.target.value)}
              placeholder="Русский, Английский A2"
            />
          </Field>

          <ArraySection
            title="Опыт работы"
            actionLabel="Добавить опыт"
            onAdd={() => addArrayItem("experience", emptyExperience)}
          >
            {resume.experience.map((item, index) => (
              <div className="repeat-row repeat-row-wide" key={`experience-${index}`}>
                <input
                  placeholder="Компания"
                  value={item.company}
                  onChange={(event) => updateArray("experience", index, "company", event.target.value)}
                />
                <input
                  placeholder="Позиция"
                  value={item.position}
                  onChange={(event) => updateArray("experience", index, "position", event.target.value)}
                />
                <input
                  placeholder="Период"
                  value={item.period}
                  onChange={(event) => updateArray("experience", index, "period", event.target.value)}
                />
                <textarea
                  rows="2"
                  placeholder="Описание задач и результатов"
                  value={item.description}
                  onChange={(event) => updateArray("experience", index, "description", event.target.value)}
                />
                <button
                  className="icon-button"
                  title="Удалить опыт"
                  onClick={() => removeArrayItem("experience", index, emptyExperience)}
                >
                  ×
                </button>
              </div>
            ))}
          </ArraySection>

          <ArraySection
            title="Проекты"
            actionLabel="Добавить проект"
            onAdd={() => addArrayItem("projects", emptyProject)}
          >
            {resume.projects.map((item, index) => (
              <div className="repeat-row repeat-row-wide" key={`project-${index}`}>
                <input
                  placeholder="Название проекта"
                  value={item.name}
                  onChange={(event) => updateArray("projects", index, "name", event.target.value)}
                />
                <input
                  placeholder="Ссылка"
                  value={item.link}
                  onChange={(event) => updateArray("projects", index, "link", event.target.value)}
                />
                <textarea
                  rows="2"
                  placeholder="Описание проекта"
                  value={item.description}
                  onChange={(event) => updateArray("projects", index, "description", event.target.value)}
                />
                <button
                  className="icon-button"
                  title="Удалить проект"
                  onClick={() => removeArrayItem("projects", index, emptyProject)}
                >
                  ×
                </button>
              </div>
            ))}
          </ArraySection>

          <ArraySection
            title="Сертификаты"
            actionLabel="Добавить сертификат"
            onAdd={() => addArrayItem("certificates", emptyCertificate)}
          >
            {resume.certificates.map((item, index) => (
              <div className="repeat-row" key={`certificate-${index}`}>
                <input
                  placeholder="Название"
                  value={item.title}
                  onChange={(event) => updateArray("certificates", index, "title", event.target.value)}
                />
                <input
                  placeholder="Организация"
                  value={item.issuer}
                  onChange={(event) => updateArray("certificates", index, "issuer", event.target.value)}
                />
                <input
                  placeholder="Год"
                  value={item.year}
                  onChange={(event) => updateArray("certificates", index, "year", event.target.value)}
                />
                <button
                  className="icon-button"
                  title="Удалить сертификат"
                  onClick={() => removeArrayItem("certificates", index, emptyCertificate)}
                >
                  ×
                </button>
              </div>
            ))}
          </ArraySection>

          <div className="form-actions sticky-actions">
            <button className="primary" onClick={saveResume} disabled={saving || loading}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button className="secondary" onClick={createNewResume}>
              Очистить форму
            </button>
          </div>

          {Object.keys(validation).length ? (
            <div className="validation-panel">
              {Object.values(validation).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          ) : null}

          {message ? <p className="message success">{message}</p> : null}
          {error ? <p className="message error">{error}</p> : null}
        </section>

        <aside className="preview-panel">
          <div className="panel-title compact-title">
            <div>
              <h2>Предпросмотр</h2>
              <p>Шаблон, ATS-анализ и экспорт PDF</p>
            </div>
            <button className="primary" onClick={exportPdf}>
              PDF
            </button>
          </div>

          <Field label="Шаблон оформления">
            <select value={resume.template} onChange={(event) => updateField("template", event.target.value)}>
              {(templates.length ? templates : [{ id: "classic", name: "Классический" }]).map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </Field>

          <ResumePreview
            resume={resume}
            sections={previewSections}
          />

          <section className="ats-card">
            <div className="ats-card-header">
              <h3>Текст вакансии для ATS-анализа</h3>
              {analysis ? <span>{analysis.score}%</span> : null}
            </div>
            <textarea
              rows="5"
              value={vacancyText}
              onChange={(event) => {
                setVacancyText(event.target.value);
                setAnalysis(null);
              }}
              placeholder="Вставьте сюда текст вакансии с сайта работодателя"
            />
            <button className="secondary wide" onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? "Проверяем..." : "Запустить ATS-анализ"}
            </button>

            {analysis ? (
              <div className="analysis-result">
                <p className="analysis-verdict">{analysis.verdict}</p>
                <KeywordGroup title="Совпавшие ключевые слова" words={analysis.matchedKeywords} type="good" />
                <KeywordGroup title="Рекомендуется добавить" words={analysis.missingKeywords} type="warn" />
                <div className="recommendations">
                  <h4>Рекомендации</h4>
                  {analysis.recommendations?.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="muted">
                Анализ сравнит резюме с текстом вакансии, покажет процент совпадения и список рекомендаций.
              </p>
            )}

            {resume.analysisHistory.length ? (
              <div className="history">
                <h4>История проверок</h4>
                {resume.analysisHistory.slice(0, 4).map((item, index) => (
                  <button
                    className="history-item"
                    key={`${item.createdAt}-${index}`}
                    onClick={() => setAnalysis(item)}
                  >
                    <span>{item.score}%</span>
                    <small>{formatDate(item.createdAt)}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </main>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className={error ? "field field-error" : "field"}>
      <span>{label}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export function ArraySection({ title, actionLabel, onAdd, children }) {
  return (
    <section className="array-section">
      <div className="array-title">
        <h3>{title}</h3>
        <button className="secondary small" onClick={onAdd}>
          {actionLabel}
        </button>
      </div>
      <div className="array-list">{children}</div>
    </section>
  );
}

export function ResumePreview({ resume, sections }) {
  return (
    <article className={`resume-preview template-${resume.template}`}>
      <div className="preview-top">
        <h1>{resume.name || "Ваше имя"}</h1>
        <p>{resume.jobTitle || "Желаемая должность"}</p>
      </div>

      <PreviewBlock title="Контакты" items={sections.contacts} fallback="Контакты не указаны" />
      <PreviewBlock title="Ссылки" items={sections.links} />
      <PreviewBlock title="Профиль" items={resume.summary ? [resume.summary] : []} />
      <PreviewBlock title="Образование" items={sections.education} fallback="Укажите образование" />
      <PreviewChips title="Навыки" items={sections.skills} />
      <PreviewChips title="Языки" items={sections.languages} />
      <PreviewBlock title="Опыт работы" items={sections.experience} fallback="Добавьте опыт или учебную практику" />
      <PreviewBlock title="Проекты" items={sections.projects} />
      <PreviewBlock title="Сертификаты" items={sections.certificates} />
    </article>
  );
}

function PreviewBlock({ title, items, fallback }) {
  if (!items.length && !fallback) {
    return null;
  }

  return (
    <section className="preview-block">
      <h3>{title}</h3>
      {items.length ? items.map((item) => <p key={`${title}-${item}`}>{item}</p>) : <p>{fallback}</p>}
    </section>
  );
}

function PreviewChips({ title, items }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="preview-block">
      <h3>{title}</h3>
      <div className="chip-list">
        {items.map((item) => (
          <span className="chip neutral-chip" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function KeywordGroup({ title, words, type }) {
  return (
    <div className="keyword-group">
      <h4>{title}</h4>
      <div className="chip-list">
        {words?.length ? (
          words.map((word) => (
            <span className={type === "good" ? "chip good-chip" : "chip warn-chip"} key={word}>
              {word}
            </span>
          ))
        ) : (
          <span className="muted">Нет данных</span>
        )}
      </div>
    </div>
  );
}

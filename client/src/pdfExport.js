function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function createResumeFileName(name) {
  const normalizedName = (name || "resume")
    .trim()
    .replace(/ё/g, "е")
    .replace(/Ё/g, "Е")
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "");

  const safeName = normalizedName || "resume";
  return `Resume_ATS_${safeName}_Neugodnikov.pdf`;
}

function getTemplatePalette(template) {
  const palettes = {
    classic: {
      header: [31, 45, 61],
      accent: [74, 153, 223],
      text: [31, 45, 61],
      muted: [91, 103, 115]
    },
    accent: {
      header: [23, 79, 87],
      accent: [221, 104, 72],
      text: [31, 45, 61],
      muted: [91, 103, 115]
    },
    compact: {
      header: [49, 58, 74],
      accent: [58, 141, 116],
      text: [31, 45, 61],
      muted: [91, 103, 115]
    },
    modern: {
      header: [42, 47, 79],
      accent: [112, 126, 222],
      text: [31, 45, 61],
      muted: [91, 103, 115]
    }
  };

  return palettes[template] ?? palettes.classic;
}

export async function exportResumePdf(resume, previewSections) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 46;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const palette = getTemplatePalette(resume.template);
  let y = 152;
  let fontName = "helvetica";

  try {
    const fontResponse = await fetch("/arial.ttf");
    const fontBuffer = await fontResponse.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);

    doc.addFileToVFS("arial.ttf", fontBase64);
    doc.addFont("arial.ttf", "ArialUnicode", "normal");
    fontName = "ArialUnicode";
    doc.setFont(fontName, "normal");
  } catch (fontError) {
    console.error("Не удалось загрузить шрифт для PDF.", fontError);
  }

  doc.setProperties({
    title: "ATS Resume Builder - резюме",
    subject: "Резюме, сформированное в интерактивном конструкторе",
    author: "Неугодников Виталий Николаевич",
    creator: "Интерактивный конструктор резюме Неугодникова Виталия Николаевича"
  });

  function setColor(color) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function setFill(color) {
    doc.setFillColor(color[0], color[1], color[2]);
  }

  function setStroke(color) {
    doc.setDrawColor(color[0], color[1], color[2]);
  }

  function setText(size, color = palette.text) {
    doc.setFont(fontName, "normal");
    doc.setFontSize(size);
    setColor(color);
  }

  function addFooter() {
    setStroke([218, 226, 235]);
    doc.setLineWidth(0.8);
    doc.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    setText(9, palette.muted);
    doc.text(
      "Сформировано в интерактивном конструкторе резюме Неугодникова Виталия Николаевича",
      margin,
      pageHeight - 22
    );
  }

  function ensureSpace(requiredHeight) {
    if (y + requiredHeight <= pageHeight - margin - 20) {
      return;
    }

    addFooter();
    doc.addPage();
    y = margin;
  }

  function addSectionTitle(title) {
    ensureSpace(42);
    setText(14, palette.text);
    doc.text(title.toUpperCase(), margin, y);
    y += 7;
    setStroke(palette.accent);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 98, y);
    y += 18;
  }

  function addWrappedText(text, options = {}) {
    const {
      x = margin,
      width = contentWidth,
      lineHeight = 14,
      size = 10.5,
      color = palette.text
    } = options;

    const lines = doc.splitTextToSize(text, width);
    ensureSpace(lines.length * lineHeight + 8);
    setText(size, color);
    doc.text(lines, x, y);
    y += lines.length * lineHeight + 8;
  }

  function addSection(title, items, fallback = "") {
    const values = items.filter(Boolean);
    if (!values.length && !fallback) {
      return;
    }

    addSectionTitle(title);
    const lines = values.length ? values : [fallback];
    for (const line of lines) {
      addWrappedText(line);
    }
    y += 4;
  }

  function addSkillChips(title, skills) {
    if (!skills.length) {
      return;
    }

    addSectionTitle(title);
    let x = margin;
    const chipHeight = 22;
    const gap = 7;

    for (const skill of skills) {
      setText(10, palette.text);
      const chipWidth = Math.min(doc.getTextWidth(skill) + 18, contentWidth);

      if (x + chipWidth > pageWidth - margin) {
        x = margin;
        y += chipHeight + gap;
      }

      ensureSpace(chipHeight + gap);
      setFill([238, 245, 252]);
      setStroke([204, 222, 241]);
      doc.roundedRect(x, y - 14, chipWidth, chipHeight, 6, 6, "FD");
      setText(10, palette.text);
      doc.text(skill, x + 9, y);
      x += chipWidth + gap;
    }

    y += chipHeight + 16;
  }

  setFill(palette.header);
  doc.rect(0, 0, pageWidth, 122, "F");
  setFill(palette.accent);
  doc.rect(0, 0, 8, 122, "F");

  setText(24, [255, 255, 255]);
  doc.text(resume.name || "Ваше имя", margin, 48);

  setText(12, [229, 238, 247]);
  doc.text(resume.jobTitle || "Желаемая должность", margin, 72);

  const contacts = previewSections.contacts.join("  |  ") || "Контакты не указаны";
  const contactLines = doc.splitTextToSize(contacts, contentWidth);
  setText(10.5, [242, 247, 252]);
  doc.text(contactLines, margin, 96);

  if (resume.summary.trim()) {
    addSection("Профиль", [resume.summary]);
  }

  addSection("Ссылки", previewSections.links);
  addSection("Образование", previewSections.education, "Укажите образование");
  addSkillChips("Навыки", previewSections.skills);
  addSkillChips("Языки", previewSections.languages);
  addSection("Опыт работы", previewSections.experience, "Здесь будет ваш опыт работы");
  addSection("Проекты", previewSections.projects);
  addSection("Сертификаты", previewSections.certificates);
  addFooter();

  doc.save(createResumeFileName(resume.name));
}

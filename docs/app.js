const DIMENSIONS = [
  "impacto_humano",
  "transparencia",
  "privacidad_datos",
  "robustez_tecnica",
  "gobernanza_cumplimiento",
];

const RUBRIC = [
  {
    name: "impacto_humano",
    keywords_risk: ["despido","sanción","perfilamiento","discriminación","sesgo","vigilancia"],
    keywords_good: ["beneficio","accesibilidad","inclusión","humano en el loop","aprobación humana"],
    tips: [
      "Define quién se beneficia y quién asume el costo del error.",
      "Incluye mecanismo de apelación o revisión humana.",
      "Evalúa sesgos por grupos (género, edad, región, etc.) cuando aplique."
    ],
  },
  {
    name: "transparencia",
    keywords_risk: ["caja negra","secreto","sin explicación","opaco"],
    keywords_good: ["explicable","trazabilidad","auditoría","registro","rationale"],
    tips: [
      "Define qué se explica (decisión, datos, incertidumbre) y a quién.",
      "Registra prompts, versiones de modelo y cambios en reglas.",
      "Entrega límites: cuándo NO confiar en la salida."
    ],
  },
  {
    name: "privacidad_datos",
    keywords_risk: ["datos sensibles","salud","biométrico","menores","sin consentimiento","compartir terceros"],
    keywords_good: ["minimización","anonimización","retención","consentimiento","cifrado"],
    tips: [
      "Minimiza datos (solo lo necesario).",
      "Define retención y borrado; separa PII.",
      "Evalúa si requiere DPIA / evaluación de impacto."
    ],
  },
  {
    name: "robustez_tecnica",
    keywords_risk: ["sin pruebas","sin monitoreo","alucinación","producción directo","sin fallback"],
    keywords_good: ["tests","monitoreo","fallback","evaluación","guardrails"],
    tips: [
      "Implementa pruebas (unitarias + casos límite) y monitoreo.",
      "Define fallback cuando el modelo esté inseguro.",
      "Evalúa deriva de datos y rendimiento por segmento."
    ],
  },
  {
    name: "gobernanza_cumplimiento",
    keywords_risk: ["sin responsable","sin política","sin control","incumplimiento"],
    keywords_good: ["responsable","política","comité","cumplimiento","roles","raci"],
    tips: [
      "Asigna dueño del sistema (accountable) y RACI.",
      "Define política de uso (qué se permite / qué no).",
      "Incluye checklist de cumplimiento y revisiones periódicas."
    ],
  },
];

const $ = (id) => document.getElementById(id);

const els = {
  text: $("projectText"),
  score: $("score"),
  level: $("level"),
  bar: $("bar"),
  dims: $("dimensions"),
  topRisks: $("topRisks"),
  pillrow: $("pillrow"),
  toggleLive: $("toggleLive"),
  btnRun: $("btnRun"),
  btnClear: $("btnClear"),
  btnLoadExample: $("btnLoadExample"),
  btnDownloadMd: $("btnDownloadMd"),
  btnDownloadHtml: $("btnDownloadHtml"),
};

const example = `# Proyecto: Agente de ventas para seguimiento automático
## Objetivo
Automatizar seguimiento de leads y generación de propuestas, usando un asistente conversacional.
## Usuarios impactados
Equipo comercial (15) y clientes.
## Datos
CRM (nombres, emails, historial), conversaciones por correo, propuestas previas.
## Controles
Aprobación humana antes de enviar a cliente. Registro y auditoría de cambios.
## Stack
LLM local + reglas + fallback.
`;

function countHits(text, terms){
  const t = text.toLowerCase();
  return terms.reduce((acc, k) => acc + (t.includes(k.toLowerCase()) ? 1 : 0), 0);
}

function level(score){
  if(score >= 85) return "Bajo riesgo (apto con monitoreo)";
  if(score >= 70) return "Riesgo medio (requiere mitigaciones)";
  if(score >= 50) return "Riesgo alto (no desplegar sin controles)";
  return "Crítico (rediseño requerido)";
}

function audit(projectText){
  const results = [];
  const allRisks = [];
  const t = (projectText || "").trim();

  RUBRIC.forEach(rule => {
    const riskHits = countHits(t, rule.keywords_risk);
    const goodHits = countHits(t, rule.keywords_good);

    let score = 12 + Math.min(goodHits, 4)*2 - Math.min(riskHits, 4)*3;
    score = Math.max(0, Math.min(20, score));

    let risks = [];
    if(riskHits > 0){
      rule.keywords_risk.forEach(kw => {
        if(t.toLowerCase().includes(kw.toLowerCase())){
          risks.push(`Indicador de riesgo: '${kw}'`);
        }
      });
    }
    if(risks.length === 0 && score < 10){
      risks.push("Faltan controles/definiciones para esta dimensión.");
    }

    let recs = [...rule.tips];
    if(score >= 16){
      recs.unshift("Bien encaminado: documenta y monitorea para sostener el control.");
    }

    allRisks.push(...risks);
    results.push({ name: rule.name, score_0_20: score, risks: risks.slice(0,4), recommendations: recs.slice(0,4) });
  });

  const total = results.reduce((acc, r) => acc + r.score_0_20, 0);
  const score100 = total;
  return {
    score_0_100: score100,
    level: level(score100),
    dimensions: results,
    top_risks: allRisks.slice(0,8),
  };
}

function render(res){
  els.score.textContent = `${res.score_0_100}`;
  els.level.textContent = res.level;
  els.bar.style.width = `${res.score_0_100}%`;

  // Pills de score por dimensión
  els.pillrow.innerHTML = "";
  res.dimensions.forEach(d => {
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = `${d.name}: ${d.score_0_20}/20`;
    els.pillrow.appendChild(pill);
  });

  // Dimensiones
  els.dims.innerHTML = "";
  res.dimensions.forEach(d => {
    const box = document.createElement("div");
    box.className = "dim";
    box.innerHTML = `
      <div class="dimhead">
        <div class="dimname">${d.name}</div>
        <div class="dimscore">${d.score_0_20}/20</div>
      </div>
      <div class="dimtags">
        ${(d.risks || []).map(r => `<span class="tag">⚠ ${escapeHtml(r)}</span>`).join("")}
      </div>
      <ul class="list">
        ${(d.recommendations || []).map(r => `<li>${escapeHtml(r)}</li>`).join("")}
      </ul>
    `;
    els.dims.appendChild(box);
  });

  // Top riesgos
  els.topRisks.innerHTML = "";
  (res.top_risks || []).forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    els.topRisks.appendChild(li);
  });
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function toMarkdown(res, inputText){
  const lines = [];
  lines.push(`# Love Audit AI – Reporte`);
  lines.push(``);
  lines.push(`**Score:** ${res.score_0_100}/100  `);
  lines.push(`**Nivel:** ${res.level}`);
  lines.push(``);
  lines.push(`## Dimensiones`);
  lines.push(``);
  res.dimensions.forEach(d => {
    lines.push(`### ${d.name} — ${d.score_0_20}/20`);
    if(d.risks?.length){
      lines.push(`**Riesgos:**`);
      d.risks.forEach(r => lines.push(`- ${r}`));
    }
    lines.push(`**Recomendaciones:**`);
    d.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push(``);
  });
  if(res.top_risks?.length){
    lines.push(`## Top riesgos (resumen)`);
    res.top_risks.forEach(r => lines.push(`- ${r}`));
    lines.push(``);
  }
  lines.push(`---`);
  lines.push(`### Texto auditado`);
  lines.push(`\n\`\`\`\n${inputText.trim()}\n\`\`\``);
  return lines.join("\n");
}

function toStandaloneHtml(res, inputText){
  const md = toMarkdown(res, inputText);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Love Audit AI - Reporte</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:28px;line-height:1.45}
    code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    pre{background:#f6f6f8;padding:14px;border-radius:10px;overflow:auto}
    h1{margin-top:0}
  </style></head><body>
  <h1>Love Audit AI – Reporte</h1>
  <p><strong>Score:</strong> ${res.score_0_100}/100<br/><strong>Nivel:</strong> ${escapeHtml(res.level)}</p>
  <h2>Dimensiones</h2>
  ${res.dimensions.map(d => `
    <h3>${escapeHtml(d.name)} — ${d.score_0_20}/20</h3>
    ${d.risks?.length ? `<p><strong>Riesgos:</strong></p><ul>${d.risks.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
    <p><strong>Recomendaciones:</strong></p>
    <ul>${d.recommendations.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>
  `).join("")}
  ${res.top_risks?.length ? `<h2>Top riesgos</h2><ul>${res.top_risks.map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
  <h2>Texto auditado</h2>
  <pre>${escapeHtml(inputText.trim())}</pre>
  <hr/>
  <details><summary>Versión Markdown (para copiar)</summary><pre>${escapeHtml(md)}</pre></details>
  </body></html>`;
}

function download(filename, content, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function run(){
  const text = els.text.value || "";
  if(!text.trim()){
    els.score.textContent = "—";
    els.level.textContent = "Espera tu texto…";
    els.bar.style.width = "0%";
    els.pillrow.innerHTML = "";
    els.dims.innerHTML = "";
    els.topRisks.innerHTML = "";
    return;
  }
  const res = audit(text);
  render(res);
  window.__last = {res, text};
}

els.btnRun.addEventListener("click", run);

els.btnClear.addEventListener("click", () => {
  els.text.value = "";
  run();
});

els.btnLoadExample.addEventListener("click", () => {
  els.text.value = example;
  run();
});

els.btnDownloadMd.addEventListener("click", () => {
  const text = els.text.value || "";
  const res = (window.__last?.res) || audit(text);
  const md = toMarkdown(res, text);
  download("audit_report.md", md, "text/markdown;charset=utf-8");
});

els.btnDownloadHtml.addEventListener("click", () => {
  const text = els.text.value || "";
  const res = (window.__last?.res) || audit(text);
  const html = toStandaloneHtml(res, text);
  download("audit_report.html", html, "text/html;charset=utf-8");
});

els.text.addEventListener("input", () => {
  if(els.toggleLive.checked) run();
});

// Init
run();


/* Love Audit AI v2 — interfaz. La lógica de evaluación está en engine.js. */
(function () {
  "use strict";

  var MODEL = window.LAA_MODEL;
  var E = window.LAA_ENGINE;
  var STORE_KEY = "love-audit-ai:v2";
  var $ = function (id) { return document.getElementById(id); };

  var state = { meta: { name: "", org: "", author: "", desc: "" }, answers: {} };

  /* ---------------- utilidades ---------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) applyImported(JSON.parse(raw), true);
    } catch (e) { /* se ignora un estado guardado inválido */ }
  }
  function allControlIds() {
    var ids = [];
    MODEL.dimensions.forEach(function (d) { d.items.forEach(function (i) { ids.push(i.id); }); });
    return ids;
  }
  function riskById(id) { return MODEL.risk.filter(function (q) { return q.id === id; })[0]; }
  function today() {
    var d = new Date();
    return d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  }

  /* ---------------- formularios ---------------- */
  function renderScaleHelp() {
    $("scaleHelp").innerHTML = MODEL.scale.map(function (s) {
      return "<dt>" + esc(s.label) + "</dt><dd>" + esc(s.help) + "</dd>";
    }).join("");
  }

  function renderRiskForm() {
    $("riskForm").innerHTML = MODEL.risk.map(function (q) {
      var type = q.type === "multi" ? "checkbox" : "radio";
      return '<fieldset class="q" id="q-' + q.id + '">' +
        "<legend>" + esc(q.text) + (q.required ? ' <span class="req" title="Obligatoria">*</span>' : "") + "</legend>" +
        (q.help ? '<p class="qhelp">' + esc(q.help) + "</p>" : "") +
        '<div class="opts ' + (q.type === "multi" ? "multi" : "") + '">' +
        q.options.map(function (o) {
          return '<label class="opt"><input type="' + type + '" name="' + q.id + '" value="' + esc(o.value) + '">' +
            "<span>" + esc(o.label) + "</span></label>";
        }).join("") +
        "</div></fieldset>";
    }).join("");
  }

  function renderControlsForm() {
    $("controlsForm").innerHTML = MODEL.dimensions.map(function (d) {
      return '<details class="dimcard" open id="dim-' + d.id + '">' +
        '<summary><span class="letter">' + d.id + "</span>" +
        '<span class="dimtitle">' + esc(d.title) + '<small>' + esc(d.question) + "</small></span>" +
        '<span class="progress" id="prog-' + d.id + '"></span></summary>' +
        d.items.map(function (it) {
          return '<fieldset class="q ctrl" id="q-' + it.id + '">' +
            "<legend>" + esc(it.text) + "</legend>" +
            '<span class="critflag" id="crit-' + it.id + '" hidden>Crítico</span>' +
            '<div class="scale">' +
            MODEL.scale.map(function (s) {
              return '<label class="sc sc-' + s.value + '"><input type="radio" name="' + it.id + '" value="' + s.value + '">' +
                "<span>" + esc(s.label) + "</span></label>";
            }).join("") +
            "</div></fieldset>";
        }).join("") +
        "</details>";
    }).join("");
  }

  function readInputsIntoState(target) {
    var name = target.name;
    if (!name) return;
    var q = riskById(name);
    if (q && q.type === "multi") {
      var boxes = document.querySelectorAll('input[name="' + name + '"]');
      // La opción "ninguno/ninguna" es excluyente
      if (target.checked && target.value === q.none) {
        boxes.forEach(function (b) { if (b !== target) b.checked = false; });
      } else if (target.checked) {
        boxes.forEach(function (b) { if (b.value === q.none) b.checked = false; });
      }
      state.answers[name] = Array.prototype.filter.call(boxes, function (b) { return b.checked; })
        .map(function (b) { return b.value; });
      return;
    }
    var v = target.value;
    state.answers[name] = /^[0-3]$/.test(v) ? parseInt(v, 10) : v;
  }

  function syncFormFromState() {
    $("f_name").value = state.meta.name || "";
    $("f_org").value = state.meta.org || "";
    $("f_author").value = state.meta.author || "";
    $("f_desc").value = state.meta.desc || "";
    document.querySelectorAll("#riskForm input, #controlsForm input").forEach(function (inp) {
      var v = state.answers[inp.name];
      if (Array.isArray(v)) inp.checked = v.indexOf(inp.value) !== -1;
      else inp.checked = v !== undefined && String(v) === inp.value;
    });
  }

  /* ---------------- resultados ---------------- */
  var lastResult = null;

  function update() {
    var res = E.evaluate(MODEL, state.answers, state.meta.desc);
    lastResult = res;
    renderResult(res);
    renderGaps(res.gaps);
    renderPlan(res);
    renderCritFlags(res);
    renderProgress();
    save();
  }

  function renderResult(res) {
    var tierEl = $("tier");
    tierEl.textContent = res.risk.label;
    tierEl.className = "tier t-" + (res.risk.tier || "none");
    $("tierReasons").innerHTML = res.risk.reasons.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");

    var dec = $("decision");
    dec.className = "decision d-" + res.decision.tone;
    $("decisionLabel").textContent = res.decision.label;
    $("decisionReasons").innerHTML = res.decision.reasons.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("");

    $("dimBars").innerHTML = res.controls.dims.map(function (d) {
      var pct = d.avg === null ? 0 : Math.round(d.avg / 3 * 100);
      var lbl = d.avg === null ? "Sin evaluar" : d.avg.toFixed(1) + " · " + d.level;
      return '<div class="bar-row" title="' + esc(d.title) + '"><span class="letter sm">' + d.id + "</span>" +
        '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
        '<span class="bar-lbl">' + esc(lbl) + "</span></div>";
    }).join("");

    var c = res.controls;
    $("counts").innerHTML =
      '<div><b>' + c.critical.length + "</b><span>críticos pendientes</span></div>" +
      '<div><b>' + c.gaps.length + "</b><span>vacíos de evidencia («No sé»)</span></div>" +
      '<div><b>' + c.unanswered + "</b><span>sin responder</span></div>";
    $("maturity").textContent = c.maturity === null ? "" :
      "Madurez de controles: " + c.maturity + " % (informativo, no decide).";
  }

  function renderCritFlags(res) {
    var tier = res.risk.tier === "inaceptable" ? "alto" : res.risk.tier;
    MODEL.dimensions.forEach(function (d) {
      d.items.forEach(function (it) {
        var flag = $("crit-" + it.id);
        var on = !!tier && it.critical.indexOf(tier) !== -1;
        flag.hidden = !on;
        flag.textContent = on ? "Crítico para riesgo " + (tier === "alto" ? "alto" : tier) : "";
      });
    });
  }

  function renderProgress() {
    MODEL.dimensions.forEach(function (d) {
      var done = d.items.filter(function (it) { return state.answers[it.id] !== undefined; }).length;
      $("prog-" + d.id).textContent = done + "/" + d.items.length;
    });
  }

  function renderGaps(g) {
    var box = $("gapbox");
    if (g.empty) {
      box.innerHTML = '<p class="hint small">Al escribir la descripción verás qué temas mencionas y cuáles faltan. El detector no califica: solo orienta.</p>';
      return;
    }
    var label = { mencionado: "Mencionado", ausente: "Mencionado como ausente", falta: "No mencionado" };
    var html = '<h3>Detector de vacíos</h3><ul class="gaps">' + g.topics.map(function (t) {
      var link = t.status === "mencionado" ? esc(t.label) : '<a href="#q-' + t.q + '">' + esc(t.label) + "</a>";
      return '<li class="g-' + t.status + '"><span class="letter sm">' + t.dim + "</span>" + link +
        '<span class="gstatus">' + label[t.status] + "</span></li>";
    }).join("") + "</ul>";
    if (g.signals.length) {
      html += '<p class="signal">Tu descripción menciona <strong>' + esc(g.signals.join(", ")) +
        '</strong>. Revisa que el <a href="#s1">Paso 1</a> lo refleje.</p>';
    }
    box.innerHTML = html;
  }

  function refsHtml(refs) {
    return Object.keys(refs).map(function (k) {
      return '<span class="ref" title="' + esc(MODEL.frameworks[k].name) + '">' + esc(MODEL.frameworks[k].short) + ": " + esc(refs[k]) + "</span>";
    }).join("");
  }

  function renderPlan(res) {
    var list = $("planList");
    if (!res.risk.tier) {
      list.innerHTML = '<li class="empty">Completa el Paso 1 para priorizar las acciones.</li>';
      return;
    }
    if (res.risk.tier === "inaceptable") {
      list.innerHTML = '<li class="crit"><div class="plan-head"><span class="pill bad">Detener</span></div>' +
        "<p><strong>Rediseña el propósito.</strong> El caso de uso coincide con una práctica prohibida. Ningún control compensa esto: replantea qué se busca y vuelve a evaluar.</p></li>";
      return;
    }
    var items = res.controls.recs.map(function (r) {
      return '<li class="' + (r.critical ? "crit" : "") + '">' +
        '<div class="plan-head"><span class="letter sm">' + r.dim + "</span>" +
        (r.critical ? '<span class="pill bad">Crítico</span>' : "") +
        '<span class="pill">' + esc(r.status) + "</span>" +
        '<a href="#q-' + r.id + '" class="plan-ctrl">' + esc(r.text) + "</a></div>" +
        "<p>" + esc(r.rec) + "</p>" +
        '<div class="refs">' + refsHtml(r.refs) + "</div></li>";
    });
    if (res.controls.notApplicable.length) {
      items.push('<li><div class="plan-head"><span class="pill">No aplica</span></div><p>Justifica en tu reporte por qué no aplican: ' +
        esc(res.controls.notApplicable.map(function (n) { return n.dim + " · " + n.text; }).join(" | ")) + "</p></li>");
    }
    list.innerHTML = items.length ? items.join("") :
      '<li class="empty">No hay acciones pendientes con las respuestas actuales. Programa la próxima revisión y vuelve a auditar después de cada cambio.</li>';
  }

  function renderMapTable() {
    var fw = Object.keys(MODEL.frameworks);
    var head = "<thead><tr><th>Dimensión</th>" + fw.map(function (k) { return "<th>" + esc(MODEL.frameworks[k].short) + "</th>"; }).join("") + "</tr></thead>";
    var body = "<tbody>" + MODEL.dimensions.map(function (d) {
      return "<tr><th><span class=\"letter sm\">" + d.id + "</span> " + esc(d.title) + "</th>" + fw.map(function (k) {
        var seen = [];
        d.items.forEach(function (it) { if (it.refs[k] && seen.indexOf(it.refs[k]) === -1) seen.push(it.refs[k]); });
        return "<td>" + (seen.length ? esc(seen.join("; ")) : '<span class="muted">—</span>') + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody>";
    $("mapTable").innerHTML = head + body;
    $("fwList").innerHTML = fw.map(function (k) {
      var f = MODEL.frameworks[k];
      return '<li><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + "</a></li>";
    }).join("");
  }

  /* ---------------- reporte ---------------- */
  function reportData() {
    var res = lastResult || E.evaluate(MODEL, state.answers, state.meta.desc);
    return { res: res, meta: state.meta, date: today(), iso: new Date().toISOString() };
  }

  function toMarkdown() {
    var d = reportData(), r = d.res, L = [];
    L.push("# Love Audit AI — Reporte de autoevaluación");
    L.push("");
    L.push("- **Sistema:** " + (d.meta.name || "(sin nombre)"));
    if (d.meta.org) L.push("- **Organización:** " + d.meta.org);
    if (d.meta.author) L.push("- **Evaluó:** " + d.meta.author);
    L.push("- **Fecha:** " + d.date);
    L.push("- **Herramienta:** Love Audit AI v" + MODEL.version + " (framework HUMANO)");
    L.push("");
    if (d.meta.desc) { L.push("## Descripción"); L.push(""); L.push(d.meta.desc.trim()); L.push(""); }
    L.push("## Riesgo del caso de uso: " + r.risk.label);
    r.risk.reasons.forEach(function (x) { L.push("- " + x); });
    L.push("");
    L.push("## Decisión HUMANO (orientativa): " + r.decision.label);
    r.decision.reasons.forEach(function (x) { L.push("- " + x); });
    L.push("");
    L.push("## Evidencia por dimensión");
    L.push("");
    L.push("| Dimensión | Promedio (0–3) | Nivel | Vacíos | No aplica | Sin responder |");
    L.push("|---|---|---|---|---|---|");
    r.controls.dims.forEach(function (x) {
      L.push("| " + x.id + " · " + x.title + " | " + (x.avg === null ? "—" : x.avg.toFixed(1)) + " | " + (x.level || "Sin evaluar") + " | " + x.gaps + " | " + x.na + " | " + x.missing + " |");
    });
    L.push("");
    if (r.controls.critical.length) {
      L.push("## Controles críticos pendientes");
      r.controls.critical.forEach(function (c) { L.push("- **" + c.dim + "** · " + c.text + " — " + c.status); });
      L.push("");
    }
    L.push("## Plan de acción");
    if (!r.controls.recs.length) L.push("- Sin acciones pendientes con las respuestas actuales.");
    r.controls.recs.forEach(function (x) {
      var refs = Object.keys(x.refs).map(function (k) { return MODEL.frameworks[k].short + ": " + x.refs[k]; }).join("; ");
      L.push("- " + (x.critical ? "**[Crítico]** " : "") + "**" + x.dim + "** · " + x.text + " (" + x.status + ")");
      L.push("  - Acción: " + x.rec);
      L.push("  - Referencias: " + refs);
    });
    L.push("");
    if (r.controls.notApplicable.length) {
      L.push("## Marcados como «No aplica» (justificar)");
      r.controls.notApplicable.forEach(function (n) { L.push("- **" + n.dim + "** · " + n.text); });
      L.push("");
    }
    if (!r.gaps.empty) {
      L.push("## Detector de vacíos en la descripción");
      r.gaps.topics.filter(function (t) { return t.status !== "mencionado"; }).forEach(function (t) {
        L.push("- " + t.dim + " · " + t.label + ": " + (t.status === "ausente" ? "mencionado como ausente" : "no mencionado"));
      });
      L.push("");
    }
    L.push("## Limitaciones");
    L.push("Autoevaluación educativa. No es certificación, auditoría independiente ni asesoría legal. Las correspondencias con marcos externos son orientativas.");
    L.push("");
    L.push("---");
    L.push("Montaña Acevedo, A. C. (2026). HUMANO: Framework metodológico para diseñar y auditar sistemas de inteligencia artificial centrados en las personas (v1.0.0). Zenodo. https://doi.org/10.5281/zenodo.22285253");
    return L.join("\n");
  }

  function toHtml() {
    var d = reportData(), r = d.res;
    var row = function (x) {
      return "<tr><td>" + x.id + " · " + esc(x.title) + "</td><td>" + (x.avg === null ? "—" : x.avg.toFixed(1)) + "</td><td>" + esc(x.level || "Sin evaluar") +
        "</td><td>" + x.gaps + "</td><td>" + x.na + "</td><td>" + x.missing + "</td></tr>";
    };
    var plan = r.controls.recs.map(function (x) {
      var refs = Object.keys(x.refs).map(function (k) { return esc(MODEL.frameworks[k].short + ": " + x.refs[k]); }).join(" · ");
      return "<li>" + (x.critical ? '<b class="crit">Crítico</b> ' : "") + "<b>" + x.dim + "</b> · " + esc(x.text) + " <em>(" + esc(x.status) + ")</em><br>" +
        esc(x.rec) + '<br><small>' + refs + "</small></li>";
    }).join("");
    var tone = { good: "#0f7a4f", warn: "#9a6400", bad: "#b4233b", neutral: "#555" }[r.decision.tone];
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>Reporte Love Audit AI — " + esc(d.meta.name || "sistema") + "</title><style>" +
      "body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:32px auto;max-width:860px;padding:0 20px;line-height:1.5;color:#1d1d29}" +
      "h1{margin:0 0 4px}h2{margin-top:28px;border-bottom:1px solid #e4e0f0;padding-bottom:4px}table{border-collapse:collapse;width:100%;font-size:14px}" +
      "td,th{border:1px solid #e4e0f0;padding:6px 8px;text-align:left}th{background:#f6f3fc}.box{border:1px solid #e4e0f0;border-radius:12px;padding:14px 18px;margin:12px 0}" +
      ".crit{color:#b4233b}li{margin:8px 0}small{color:#666}.meta{color:#555}pre{white-space:pre-wrap;background:#f6f3fc;padding:12px;border-radius:8px}" +
      "@media print{body{margin:0}}</style></head><body>" +
      "<h1>Love Audit AI — Reporte de autoevaluación</h1>" +
      '<p class="meta"><b>Sistema:</b> ' + esc(d.meta.name || "(sin nombre)") +
      (d.meta.org ? " · <b>Organización:</b> " + esc(d.meta.org) : "") +
      (d.meta.author ? " · <b>Evaluó:</b> " + esc(d.meta.author) : "") +
      "<br><b>Fecha:</b> " + esc(d.date) + " · <b>Herramienta:</b> Love Audit AI v" + MODEL.version + " (framework HUMANO)</p>" +
      (d.meta.desc ? "<h2>Descripción</h2><pre>" + esc(d.meta.desc.trim()) + "</pre>" : "") +
      '<div class="box"><b>Riesgo del caso de uso:</b> ' + esc(r.risk.label) + "<ul>" + r.risk.reasons.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="box" style="border-color:' + tone + '"><b style="color:' + tone + '">Decisión HUMANO (orientativa): ' + esc(r.decision.label) + "</b><ul>" +
      r.decision.reasons.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
      "<h2>Evidencia por dimensión</h2><table><tr><th>Dimensión</th><th>Promedio (0–3)</th><th>Nivel</th><th>Vacíos</th><th>No aplica</th><th>Sin responder</th></tr>" +
      r.controls.dims.map(row).join("") + "</table>" +
      "<h2>Plan de acción</h2>" + (plan ? "<ol>" + plan + "</ol>" : "<p>Sin acciones pendientes con las respuestas actuales.</p>") +
      (r.controls.notApplicable.length ? "<h2>Marcados como «No aplica» (justificar)</h2><ul>" +
        r.controls.notApplicable.map(function (n) { return "<li><b>" + n.dim + "</b> · " + esc(n.text) + "</li>"; }).join("") + "</ul>" : "") +
      "<h2>Limitaciones</h2><p>Autoevaluación educativa. No es certificación, auditoría independiente ni asesoría legal. Las correspondencias con marcos externos son orientativas.</p>" +
      '<p><small>Montaña Acevedo, A. C. (2026). HUMANO: Framework metodológico para diseñar y auditar sistemas de inteligencia artificial centrados en las personas (v1.0.0). Zenodo. https://doi.org/10.5281/zenodo.22285253</small></p>' +
      "</body></html>";
  }

  function toJson() {
    return JSON.stringify({ tool: "Love Audit AI", version: MODEL.version, exportedAt: new Date().toISOString(), meta: state.meta, answers: state.answers }, null, 2);
  }

  function slug() {
    return (state.meta.name || "sistema").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "sistema";
  }

  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function doExport(kind) {
    if (kind === "md") download("love-audit-" + slug() + ".md", toMarkdown(), "text/markdown;charset=utf-8");
    if (kind === "html") download("love-audit-" + slug() + ".html", toHtml(), "text/html;charset=utf-8");
    if (kind === "json") download("love-audit-" + slug() + ".json", toJson(), "application/json");
  }

  /* Solo se aceptan ids y valores conocidos al importar */
  function applyImported(data, silent) {
    if (!data || typeof data !== "object" || !data.answers || typeof data.answers !== "object") {
      if (!silent) alertBox("El archivo no tiene el formato de Love Audit AI.");
      return false;
    }
    var clean = {};
    MODEL.risk.forEach(function (q) {
      var v = data.answers[q.id];
      var allowed = q.options.map(function (o) { return o.value; });
      if (q.type === "multi" && Array.isArray(v)) clean[q.id] = v.filter(function (x) { return allowed.indexOf(x) !== -1; });
      else if (allowed.indexOf(v) !== -1) clean[q.id] = v;
    });
    allControlIds().forEach(function (id) {
      var v = data.answers[id];
      if (v === 0 || v === 1 || v === 2 || v === 3 || v === "ns" || v === "na") clean[id] = v;
    });
    var m = data.meta || {};
    state.meta = {
      name: String(m.name || "").slice(0, 200), org: String(m.org || "").slice(0, 200),
      author: String(m.author || "").slice(0, 200), desc: String(m.desc || "").slice(0, 20000)
    };
    state.answers = clean;
    return true;
  }

  function alertBox(msg) {
    var n = document.createElement("div");
    n.className = "toast"; n.setAttribute("role", "status"); n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function () { n.remove(); }, 4000);
  }

  /* ---------------- ejemplos ---------------- */
  var EXAMPLES = {
    ventas: {
      meta: {
        name: "Agente de ventas para seguimiento de clientes", org: "Empresa de ejemplo", author: "",
        desc: "Objetivo: automatizar el seguimiento de clientes potenciales y redactar propuestas con un asistente conversacional.\n" +
          "Usuarios: equipo comercial (15 personas) y clientes que reciben los correos.\n" +
          "Datos: CRM con nombres, correos e historial de compras, conversaciones por correo y propuestas anteriores.\n" +
          "Controles: una persona aprueba cada correo antes de enviarlo. Registro de cambios y versiones de prompts.\n" +
          "Responsable: la gerente comercial. Plan B: si el asistente falla, el seguimiento vuelve a ser manual."
      },
      answers: {
        r_people: "si", r_domain: ["ninguno"], r_prohibited: ["ninguna"], r_autonomy: "recomienda", r_sensitive: "no",
        r_vulnerable: "no", r_reversibility: "facil", r_interaction: "si", r_scale: "cientos",
        h1: 2, h2: 1, h3: 1, h4: 2, u1: 2, u2: "na", u3: 0, u4: 1, m1: 2, m2: 1, m3: 2, m4: 2, m5: 1,
        a1: 1, a2: 1, a3: 3, a4: 0, a5: 0, n1: 2, n2: 2, n3: 1, n4: 1, n5: 2, o1: 1, o2: 2, o3: 1, o4: 2, o5: 0
      }
    },
    seleccion: {
      meta: {
        name: "Asistente de preselección de hojas de vida", org: "Empresa de ejemplo", author: "",
        desc: "Propósito: puntuar hojas de vida y proponer una lista corta de candidatos para el área de talento humano.\n" +
          "Datos: historial de contrataciones de los últimos cinco años y hojas de vida recibidas.\n" +
          "Un reclutador revisa la lista corta antes de llamar a entrevista.\n" +
          "Todavía no hay evaluación de sesgos por género o edad, y no existe una vía para que el candidato pida revisión.\n" +
          "Se registran las versiones del modelo."
      },
      answers: {
        r_people: "si", r_domain: ["empleo"], r_prohibited: ["ninguna"], r_autonomy: "recomienda", r_sensitive: "ns",
        r_vulnerable: "no", r_reversibility: "esfuerzo", r_interaction: "no", r_scale: "miles",
        h1: 2, h2: 1, h3: 0, h4: 2, u1: 1, u2: 0, u3: 0, u4: "ns", m1: 1, m2: 0, m3: 1, m4: 2, m5: 1,
        a1: 0, a2: 1, a3: 2, a4: 0, a5: 1, n1: 2, n2: 1, n3: 0, n4: 1, n5: 1, o1: 0, o2: 2, o3: 1, o4: 0, o5: 0
      }
    }
  };

  /* ---------------- eventos ---------------- */
  function closeMenus() {
    document.querySelectorAll(".menu-list").forEach(function (m) { m.hidden = true; });
    document.querySelectorAll("[data-menu]").forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }

  function bind() {
    document.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches("#riskForm input, #controlsForm input")) { readInputsIntoState(t); update(); }
    });
    [["f_name", "name"], ["f_org", "org"], ["f_author", "author"], ["f_desc", "desc"]].forEach(function (p) {
      $(p[0]).addEventListener("input", function (e) { state.meta[p[1]] = e.target.value; update(); });
    });

    document.querySelectorAll("[data-menu]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var list = $("menu-" + btn.getAttribute("data-menu"));
        var open = list.hidden;
        closeMenus();
        list.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".menu")) closeMenus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenus(); });

    document.querySelectorAll("[data-example]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ex = EXAMPLES[b.getAttribute("data-example")];
        applyImported(JSON.parse(JSON.stringify(ex)), true);
        syncFormFromState(); update(); closeMenus();
        alertBox("Ejemplo cargado: " + ex.meta.name);
      });
    });
    document.querySelectorAll("[data-export]").forEach(function (b) {
      b.addEventListener("click", function () { doExport(b.getAttribute("data-export")); closeMenus(); });
    });
    $("importFile").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          if (applyImported(JSON.parse(reader.result), false)) { syncFormFromState(); update(); alertBox("Respuestas importadas."); }
        } catch (err) { alertBox("No se pudo leer el archivo JSON."); }
        e.target.value = "";
        closeMenus();
      };
      reader.readAsText(f);
    });
    $("btnReset").addEventListener("click", function () {
      if (!window.confirm("¿Borrar todas las respuestas de este navegador y empezar de nuevo?")) return;
      state = { meta: { name: "", org: "", author: "", desc: "" }, answers: {} };
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* sin almacenamiento */ }
      syncFormFromState(); update();
    });
  }

  /* ---------------- inicio ---------------- */
  $("ver").textContent = "v" + MODEL.version;
  renderScaleHelp();
  renderRiskForm();
  renderControlsForm();
  renderMapTable();
  load();
  syncFormFromState();
  bind();
  update();
})();

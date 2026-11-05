/* Love Audit AI v2 — motor de evaluación.
 * Funciones puras: reciben respuestas y devuelven resultados. Sin acceso al DOM,
 * para que la lógica se pueda probar y auditar (ver tests/run.js).
 */
(function (root) {
  "use strict";

  var TIER_LABEL = {
    inaceptable: "Inaceptable",
    alto: "Alto",
    limitado: "Limitado",
    minimo: "Mínimo"
  };

  var DECISION = {
    detener: { label: "No aprobar: posible práctica prohibida", tone: "bad" },
    no_todavia: { label: "No aprobar todavía", tone: "bad" },
    condiciones: { label: "Aprobar con condiciones", tone: "warn" },
    aprobar: { label: "Aprobar", tone: "good" },
    sin_decision: { label: "Sin decisión todavía", tone: "neutral" }
  };

  var LEVEL_NAMES = ["No existe", "Declarado", "Documentado o medido", "Verificado"];

  function isAnswered(v) {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== "";
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ");
  }

  /* ---------------- Paso 1: riesgo inherente ---------------- */
  function classifyRisk(model, answers) {
    var a = answers || {};
    var missing = model.risk.filter(function (q) { return q.required && !isAnswered(a[q.id]); })
      .map(function (q) { return q.text; });
    var reasons = [];
    var unknowns = [];

    model.risk.forEach(function (q) {
      if (a[q.id] === "ns") unknowns.push(q.text);
    });

    var prohibited = (a.r_prohibited || []).filter(function (v) { return v !== "ninguna"; });
    if (prohibited.length) {
      var q3 = model.risk.filter(function (q) { return q.id === "r_prohibited"; })[0];
      prohibited.forEach(function (v) {
        var opt = q3.options.filter(function (o) { return o.value === v; })[0];
        reasons.push("Posible práctica prohibida: " + (opt ? opt.label.toLowerCase() : v) + ".");
      });
      return { tier: "inaceptable", label: TIER_LABEL.inaceptable, reasons: reasons, unknowns: unknowns, missing: missing };
    }

    if (missing.length) {
      return { tier: null, label: "Sin clasificar", reasons: ["Responde las preguntas obligatorias del Paso 1."], unknowns: unknowns, missing: missing };
    }

    var domains = (a.r_domain || []).filter(function (v) { return v !== "ninguno"; });
    var people = a.r_people;
    var peopleOrUnknown = people === "si" || people === "ns";

    var alto = false;
    if (domains.indexOf("biometria") !== -1) {
      alto = true; reasons.push("Usa identificación o categorización biométrica.");
    }
    if (peopleOrUnknown && domains.length) {
      alto = true;
      reasons.push((people === "ns" ? "Podría influir" : "Influye") + " en decisiones sobre personas en un ámbito de alto riesgo (" + domains.length + " ámbito" + (domains.length > 1 ? "s" : "") + ").");
    }
    if (peopleOrUnknown && a.r_reversibility === "irreversible") {
      alto = true; reasons.push("Un error puede causar un daño difícil o imposible de reparar.");
    }
    if (peopleOrUnknown && a.r_autonomy === "automatico" && (a.r_sensitive === "si" || a.r_vulnerable === "si")) {
      alto = true; reasons.push("Decide sin revisión humana sobre datos sensibles o poblaciones vulnerables.");
    }
    if (a.r_sensitive === "si" && a.r_vulnerable === "si") {
      alto = true; reasons.push("Combina datos sensibles con poblaciones vulnerables.");
    }
    if (alto) {
      if (unknowns.length) reasons.push("Hay respuestas «No sé»: la clasificación se tomó de forma conservadora.");
      return { tier: "alto", label: TIER_LABEL.alto, reasons: reasons, unknowns: unknowns, missing: missing };
    }

    var limitado = false;
    if (peopleOrUnknown) { limitado = true; reasons.push("Influye en decisiones sobre personas, fuera de los ámbitos de alto riesgo."); }
    if (a.r_sensitive === "si" || a.r_sensitive === "ns") { limitado = true; reasons.push("Usa (o podría usar) datos personales sensibles."); }
    if (a.r_vulnerable === "si" || a.r_vulnerable === "ns") { limitado = true; reasons.push("Puede afectar a poblaciones vulnerables."); }
    if (a.r_interaction === "si" || a.r_interaction === "ns") { limitado = true; reasons.push("Conversa con personas o genera contenido: requiere avisos de transparencia."); }
    if (a.r_reversibility === "irreversible" || a.r_reversibility === "ns") { limitado = true; reasons.push("No está claro que los errores sean fáciles de reparar."); }
    if (limitado) {
      if (unknowns.length) reasons.push("Hay respuestas «No sé»: la clasificación se tomó de forma conservadora.");
      return { tier: "limitado", label: TIER_LABEL.limitado, reasons: reasons, unknowns: unknowns, missing: missing };
    }

    reasons.push("No decide sobre personas, no usa datos sensibles y no genera contenido para el público.");
    return { tier: "minimo", label: TIER_LABEL.minimo, reasons: reasons, unknowns: unknowns, missing: missing };
  }

  /* ---------------- Paso 2: controles HUMANO ---------------- */
  function evaluateControls(model, answers, tier) {
    var a = answers || {};
    var dims = [];
    var critical = [];
    var recs = [];
    var gaps = [];
    var notApplicable = [];
    var unanswered = 0;
    var applicable = 0;

    model.dimensions.forEach(function (d) {
      var sum = 0, n = 0, dGaps = 0, dNa = 0, dMissing = 0;
      d.items.forEach(function (it) {
        var v = a[it.id];
        var isCrit = !!tier && it.critical.indexOf(tier) !== -1;
        if (v === "na") {
          dNa++; notApplicable.push({ dim: d.id, id: it.id, text: it.text, critical: isCrit });
          return;
        }
        applicable++;
        if (v === "ns") { dGaps++; gaps.push({ dim: d.id, id: it.id, text: it.text, critical: isCrit }); }
        else if (typeof v === "number") { sum += v; n++; }
        else { dMissing++; unanswered++; }

        var weak = v === "ns" || v === 0 || v === 1 || !isAnswered(v);
        if (isCrit && (v === 0 || v === "ns" || !isAnswered(v))) {
          critical.push({ dim: d.id, id: it.id, text: it.text, status: v === "ns" ? "No sé" : (v === 0 ? "No existe" : "Sin responder") });
        }
        if (weak && (isAnswered(v) || isCrit)) {
          recs.push({
            dim: d.id, id: it.id, critical: isCrit, value: v,
            status: v === "ns" ? "No sé" : (v === 0 ? "No existe" : (v === 1 ? "Declarado" : "Sin responder")),
            text: it.text, rec: it.rec, refs: it.refs
          });
        }
      });
      var avg = n ? sum / n : null;
      dims.push({
        id: d.id, title: d.title, avg: avg,
        level: avg === null ? null : LEVEL_NAMES[Math.round(avg)],
        answered: n, gaps: dGaps, na: dNa, missing: dMissing, total: d.items.length
      });
    });

    recs.sort(function (x, y) {
      if (x.critical !== y.critical) return x.critical ? -1 : 1;
      var rank = function (r) { return r.value === 0 ? 0 : (r.value === "ns" ? 1 : (isAnswered(r.value) ? 2 : 3)); };
      return rank(x) - rank(y);
    });

    var withData = dims.filter(function (d) { return d.avg !== null; });
    var maturity = withData.length
      ? Math.round(withData.reduce(function (s, d) { return s + d.avg / 3; }, 0) / withData.length * 100)
      : null;

    return {
      dims: dims, critical: critical, recs: recs, gaps: gaps, notApplicable: notApplicable,
      unanswered: unanswered, applicable: applicable, maturity: maturity
    };
  }

  /* ---------------- Decisión HUMANO (orientativa) ---------------- */
  function decide(risk, controls) {
    var reasons = [];
    var code;
    if (risk.tier === "inaceptable") {
      return { code: "detener", label: DECISION.detener.label, tone: DECISION.detener.tone,
        reasons: ["El caso de uso coincide con una práctica que la Ley de IA de la UE prohíbe. Rediseña el propósito antes de evaluar controles."] };
    }
    if (!risk.tier) {
      return { code: "sin_decision", label: DECISION.sin_decision.label, tone: DECISION.sin_decision.tone,
        reasons: ["Primero clasifica el riesgo del caso de uso (Paso 1)."] };
    }

    var crit = controls.critical;
    var critZero = crit.filter(function (c) { return c.status === "No existe"; }).length;
    var dims = controls.dims;
    var minAvg = dims.reduce(function (m, d) { return d.avg === null ? m : Math.min(m, d.avg); }, 3);
    var dimsWithoutData = dims.filter(function (d) { return d.avg === null; }).length;

    if (risk.tier === "alto") {
      if (crit.length) {
        code = "no_todavia";
        reasons.push(crit.length + " control" + (crit.length > 1 ? "es críticos" : " crítico") + " sin evidencia para un sistema de riesgo alto.");
      } else if (minAvg >= 2 && dimsWithoutData === 0 && controls.gaps.length === 0) {
        code = "aprobar";
        reasons.push("Todas las dimensiones tienen al menos evidencia documentada y no hay vacíos de evidencia.");
      } else {
        code = "condiciones";
        reasons.push("Los controles críticos tienen evidencia, pero hay dimensiones por debajo de «documentado» o vacíos de evidencia.");
      }
    } else if (risk.tier === "limitado") {
      if (critZero >= 2) {
        code = "no_todavia";
        reasons.push(critZero + " controles críticos no existen.");
      } else if (crit.length) {
        code = "condiciones";
        reasons.push(crit.length + " control" + (crit.length > 1 ? "es críticos pendientes" : " crítico pendiente") + ".");
      } else if (minAvg >= 1.5 && dimsWithoutData === 0) {
        code = "aprobar";
        reasons.push("Los controles críticos tienen evidencia y las dimensiones están entre «declarado» y «documentado» o mejor.");
      } else {
        code = "condiciones";
        reasons.push("Hay dimensiones con controles débiles o sin evaluar.");
      }
    } else {
      if (minAvg < 1 || dimsWithoutData > 0) {
        code = "condiciones";
        reasons.push("Riesgo mínimo, pero hay dimensiones sin controles o sin evaluar.");
      } else {
        code = "aprobar";
        reasons.push("Riesgo mínimo y controles básicos presentes.");
      }
    }

    if (code === "aprobar" && controls.unanswered > 0) {
      code = "condiciones";
      reasons.push("Faltan " + controls.unanswered + " respuesta" + (controls.unanswered > 1 ? "s" : "") + " por completar.");
    }
    if (risk.unknowns.length && code === "aprobar") {
      code = "condiciones";
      reasons.push("Hay respuestas «No sé» en la clasificación del riesgo.");
    }
    return { code: code, label: DECISION[code].label, tone: DECISION[code].tone, reasons: reasons };
  }

  /* ---------------- Detector de vacíos ---------------- */
  /* Negación por cláusula: el texto se divide en cláusulas (punto, coma, punto y coma,
   * dos puntos, salto de línea o "pero"). En cada cláusula se mira la primera vez que
   * aparece el tema; si hay una negación en las cinco palabras anteriores, esa cláusula
   * lo menciona como ausente. El tema cuenta como mencionado si alguna cláusula lo
   * menciona sin negación. */
  var NEGATION = /\b(?:sin|no|ningun[oa]?|carece|carecen|tampoco|falta|faltan)\b/;
  var CLAUSE_BREAK = /[.;:,\n]|\bpero\b/;

  function topicStatus(clauses, terms) {
    var status = "falta";
    for (var c = 0; c < clauses.length; c++) {
      var clause = clauses[c], first = -1;
      for (var i = 0; i < terms.length; i++) {
        var idx = clause.indexOf(terms[i]);
        if (idx !== -1 && (first === -1 || idx < first)) first = idx;
      }
      if (first === -1) continue;
      var lastWords = clause.slice(0, first).trim().split(/\s+/).slice(-5).join(" ");
      if (!NEGATION.test(lastWords)) return "mencionado";
      status = "ausente";
    }
    return status;
  }

  function detectGaps(model, description) {
    var t = normalize(description).replace(/\bsin embargo\b/g, " ");
    if (!t.trim()) return { empty: true, topics: [], signals: [] };
    var clauses = t.split(CLAUSE_BREAK);
    var topics = model.gapTopics.map(function (topic) {
      var status = topicStatus(clauses, topic.terms);
      return { dim: topic.dim, id: topic.id, label: topic.label, q: topic.q, status: status };
    });
    var signals = model.riskSignals.filter(function (s) {
      return s.terms.some(function (term) { return t.indexOf(term) !== -1; });
    }).map(function (s) { return s.label; });
    return { empty: false, topics: topics, signals: signals };
  }

  function evaluate(model, answers, description) {
    var risk = classifyRisk(model, answers);
    var controls = evaluateControls(model, answers, risk.tier === "inaceptable" ? "alto" : risk.tier);
    var decision = decide(risk, controls);
    return { risk: risk, controls: controls, decision: decision, gaps: detectGaps(model, description) };
  }

  var ENGINE = {
    classifyRisk: classifyRisk,
    evaluateControls: evaluateControls,
    decide: decide,
    detectGaps: detectGaps,
    evaluate: evaluate,
    normalize: normalize,
    TIER_LABEL: TIER_LABEL,
    DECISION: DECISION,
    LEVEL_NAMES: LEVEL_NAMES
  };

  if (typeof module === "object" && module.exports) module.exports = ENGINE;
  else root.LAA_ENGINE = ENGINE;
})(typeof window !== "undefined" ? window : this);

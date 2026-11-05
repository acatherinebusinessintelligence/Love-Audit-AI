/* Pruebas del motor de Love Audit AI.
 * Uso: node tests/run.js
 * Cada escenario fija respuestas y verifica el riesgo, la decisión o el detector de vacíos.
 * Incluye los casos que fallaban en la versión 1 (ver CHANGELOG.md).
 */
"use strict";
const path = require("path");
const MODEL = require(path.join(__dirname, "..", "docs", "questions.js"));
const E = require(path.join(__dirname, "..", "docs", "engine.js"));

let fails = 0, total = 0;
function check(name, cond, detail) {
  total++;
  if (cond) console.log("  ok   " + name);
  else { fails++; console.log("  FALLA " + name + (detail ? "  →  " + detail : "")); }
}

const allIds = MODEL.dimensions.flatMap(d => d.items.map(i => i.id));
const fill = (v, over = {}) => Object.assign(Object.fromEntries(allIds.map(id => [id, v])), over);

const RISK_ALTO = { r_people: "si", r_domain: ["empleo"], r_prohibited: ["ninguna"], r_autonomy: "recomienda", r_sensitive: "no", r_vulnerable: "no", r_reversibility: "esfuerzo", r_interaction: "no", r_scale: "cientos" };
const RISK_LIMITADO = { r_people: "no", r_domain: ["ninguno"], r_prohibited: ["ninguna"], r_autonomy: "recomienda", r_sensitive: "no", r_vulnerable: "no", r_reversibility: "facil", r_interaction: "si", r_scale: "miles" };
const RISK_MINIMO = { r_people: "no", r_domain: ["ninguno"], r_prohibited: ["ninguna"], r_autonomy: "recomienda", r_sensitive: "no", r_vulnerable: "no", r_reversibility: "facil", r_interaction: "no", r_scale: "pocas" };

const ev = (answers, text) => E.evaluate(MODEL, answers, text || "");

console.log("\nClasificación del riesgo");
let r = ev({});
check("sin respuestas → sin clasificar y sin decisión", r.risk.tier === null && r.decision.code === "sin_decision");
r = ev(Object.assign({}, RISK_ALTO, { r_prohibited: ["emociones"] }));
check("práctica prohibida → inaceptable y detener", r.risk.tier === "inaceptable" && r.decision.code === "detener");
r = ev(RISK_ALTO);
check("empleo + decide sobre personas → alto", r.risk.tier === "alto");
r = ev(Object.assign({}, RISK_ALTO, { r_people: "ns" }));
check("«No sé» si decide sobre personas, en empleo → alto (conservador)", r.risk.tier === "alto" && r.risk.unknowns.length === 1);
r = ev(Object.assign({}, RISK_MINIMO, { r_domain: ["biometria"] }));
check("biometría → alto aunque no decida sobre personas", r.risk.tier === "alto");
r = ev(RISK_LIMITADO);
check("chatbot sin decisiones sobre personas → limitado", r.risk.tier === "limitado");
r = ev(RISK_MINIMO);
check("sin personas, datos sensibles ni contenido → mínimo", r.risk.tier === "minimo");

console.log("\nDecisión (casos que fallaban en v1)");
r = ev(Object.assign({}, RISK_ALTO, { r_reversibility: "irreversible" }, fill(3)));
check("v1 daba «Bajo riesgo» con daño irreversible: ahora el riesgo se informa como ALTO aparte de los controles",
  r.risk.tier === "alto" && r.decision.code === "aprobar");
r = ev(Object.assign({}, RISK_ALTO, { h1: 3 }));
check("v1 daba «Crítico 4/100» con una sola respuesta: ahora dice que faltan controles críticos",
  r.decision.code === "no_todavia" && r.controls.critical.some(c => c.status === "Sin responder"));
r = ev(Object.assign({}, RISK_ALTO, fill(3, { u2: "ns" })));
check("alto con «No sé» en un control crítico → no aprobar todavía", r.decision.code === "no_todavia");
r = ev(Object.assign({}, RISK_ALTO, fill(3, { m5: "ns" })));
check("alto con «No sé» en un control no crítico → con condiciones", r.decision.code === "condiciones");
r = ev(Object.assign({}, RISK_ALTO, fill(2)));
check("alto con todo documentado → aprobar", r.decision.code === "aprobar");
r = ev(Object.assign({}, RISK_ALTO, fill(2, { o5: 1 })));
check("alto con una dimensión por debajo de documentado → con condiciones", r.decision.code === "condiciones");
r = ev(Object.assign({}, RISK_LIMITADO, fill(2)));
check("limitado con controles documentados → aprobar", r.decision.code === "aprobar");
r = ev(Object.assign({}, RISK_LIMITADO, fill(2, { n1: 0 })));
check("limitado con un control crítico inexistente → con condiciones", r.decision.code === "condiciones");
r = ev(Object.assign({}, RISK_LIMITADO, fill(2, { n1: 0, a1: 0 })));
check("limitado con dos controles críticos inexistentes → no aprobar todavía", r.decision.code === "no_todavia");
r = ev(Object.assign({}, RISK_MINIMO, fill(1)));
check("mínimo con controles declarados → aprobar", r.decision.code === "aprobar");
r = ev(Object.assign({}, RISK_MINIMO, fill(1, { o1: undefined })));
check("aprobar baja a «con condiciones» si faltan respuestas", r.decision.code === "condiciones");
r = ev(Object.assign({}, RISK_ALTO, fill(2, { u3: "na" })));
check("«No aplica» no penaliza y queda listado para justificar", r.decision.code === "aprobar" && r.controls.notApplicable.length === 1);
r = ev(Object.assign({}, RISK_ALTO, fill(0)));
check("plan de acción prioriza los controles críticos", r.controls.recs.length > 0 && r.controls.recs[0].critical === true);

console.log("\nDetector de vacíos");
let g = E.detectGaps(MODEL, "hola");
check("v1 daba 60/100 a «hola»: ahora no hay puntaje y casi todo aparece como faltante",
  g.topics.filter(t => t.status === "falta").length >= g.topics.length - 1);
g = E.detectGaps(MODEL, "Sistema sin consentimiento de los titulares");
check("«sin consentimiento» → autorización marcada como ausente", g.topics.find(t => t.id === "autorizacion").status === "ausente");
g = E.detectGaps(MODEL, "Usamos consentimiento informado");
check("«consentimiento informado» → autorización mencionada", g.topics.find(t => t.id === "autorizacion").status === "mencionado");
g = E.detectGaps(MODEL, "Sin embargo, hay un responsable del sistema");
check("«sin embargo» no se confunde con negación", g.topics.find(t => t.id === "responsable").status === "mencionado");
g = E.detectGaps(MODEL, "No hay responsable todavía. Desde enero, el responsable será la gerente comercial.");
check("si una aparición no está negada, el tema cuenta como mencionado", g.topics.find(t => t.id === "responsable").status === "mencionado");
g = E.detectGaps(MODEL, "Perfilamiento de empleados para decidir despidos con reconocimiento facial");
check("señales de riesgo detectadas", g.signals.includes("biometría") && g.signals.includes("decisiones laborales") && g.signals.includes("vigilancia o perfilamiento"));

g = E.detectGaps(MODEL, "Todavía no hay evaluación de sesgos por género o edad, y no existe una vía para que el candidato pida revisión. Un reclutador revisa la lista.");
check("la negación cubre toda la cláusula (sesgos por género o edad → ausente)", g.topics.find(t => t.id === "grupos").status === "ausente");
check("«no existe una vía para que pida revisión» → apelación ausente", g.topics.find(t => t.id === "apelacion").status === "ausente");
check("la cláusula siguiente no hereda la negación (un reclutador revisa → supervisión mencionada)", g.topics.find(t => t.id === "supervision").status === "mencionado");
check("«evaluación de sesgos» ya no se confunde con pruebas antes de desplegar", g.topics.find(t => t.id === "pruebas").status === "falta");

g = E.detectGaps(MODEL, "Sistema sin consentimiento que hace perfilamiento de empleados");
check("la negación no se extiende lejos (empleados no hereda el «sin» de consentimiento)", g.topics.find(t => t.id === "afectados").status === "mencionado" && g.topics.find(t => t.id === "autorizacion").status === "ausente");

console.log("\nIntegridad del modelo");
const ids = new Set();
let dup = false;
MODEL.dimensions.forEach(d => d.items.forEach(i => { if (ids.has(i.id)) dup = true; ids.add(i.id); }));
check("ids de preguntas únicos", !dup);
check("seis dimensiones H-U-M-A-N-O", MODEL.dimensions.map(d => d.id).join("") === "HUMANO");
check("cada pregunta tiene recomendación y al menos una referencia",
  MODEL.dimensions.every(d => d.items.every(i => i.rec && Object.keys(i.refs).length)));
check("las referencias usan marcos conocidos",
  MODEL.dimensions.every(d => d.items.every(i => Object.keys(i.refs).every(k => MODEL.frameworks[k]))));
check("el detector apunta a preguntas existentes", MODEL.gapTopics.every(t => ids.has(t.q)));

console.log(`\n${total - fails}/${total} pruebas correctas`);
process.exit(fails ? 1 : 0);

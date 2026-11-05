/* Love Audit AI v2 — modelo de evaluación basado en el framework HUMANO.
 * Este archivo solo contiene datos: preguntas, opciones, recomendaciones y
 * correspondencia con marcos externos. La lógica está en engine.js.
 *
 * Correspondencias: son orientativas. Indican dónde un marco trata un tema
 * parecido; no significan cumplimiento ni equivalencia legal.
 */
(function (root) {
  "use strict";

  var FRAMEWORKS = {
    nist: {
      short: "NIST AI RMF",
      name: "NIST AI Risk Management Framework 1.0 (2023)",
      url: "https://www.nist.gov/itl/ai-risk-management-framework"
    },
    eu: {
      short: "Ley de IA UE",
      name: "Ley de IA de la UE — Reglamento (UE) 2024/1689",
      url: "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689"
    },
    co: {
      short: "Colombia",
      name: "Colombia — Ley 1581 de 2012, Circular Externa 002 de 2024 de la SIC y CONPES 4144 de 2025",
      url: "https://www.sic.gov.co/tema/proteccion-de-datos-personales"
    },
    oecd: {
      short: "OCDE",
      name: "Principios de IA de la OCDE (2019, actualizados en 2024)",
      url: "https://oecd.ai/en/ai-principles"
    },
    unesco: {
      short: "UNESCO",
      name: "Recomendación de la UNESCO sobre la Ética de la IA (2021)",
      url: "https://www.unesco.org/es/artificial-intelligence/recommendation-ethics"
    }
  };

  /* Escala única de evidencia, alineada con los niveles de evidencia de HUMANO */
  var SCALE = [
    { value: 0, label: "No existe", help: "No se ha hecho o no hay nada al respecto." },
    { value: 1, label: "Declarado", help: "Se dice o se hace, pero no está documentado (evidencia descriptiva)." },
    { value: 2, label: "Documentado o medido", help: "Hay un documento, métrica o registro verificable." },
    { value: 3, label: "Verificado", help: "Se revisó, se intervino cuando hizo falta y se volvió a medir." },
    { value: "ns", label: "No sé", help: "Vacío de evidencia: hay que averiguarlo." },
    { value: "na", label: "No aplica", help: "No corresponde a este sistema. Explica por qué en tu reporte." }
  ];

  /* ---------------- Paso 1 · Riesgo inherente del caso de uso ---------------- */
  var RISK = [
    {
      id: "r_people", type: "single", required: true,
      text: "¿El sistema toma, recomienda o influye en decisiones sobre personas?",
      help: "Por ejemplo: a quién contratar, admitir, atender primero, prestar, sancionar o recomendar.",
      options: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_domain", type: "multi", required: true, none: "ninguno",
      text: "¿En cuál de estos ámbitos se usa?",
      help: "Son los ámbitos que la Ley de IA de la UE considera de alto riesgo (Anexo III), más salud. Marca todos los que apliquen.",
      options: [
        { value: "empleo", label: "Empleo o gestión de trabajadores (selección, evaluación, despidos)" },
        { value: "educacion", label: "Educación (admisión, evaluación, vigilancia de exámenes)" },
        { value: "servicios", label: "Acceso a servicios esenciales (crédito, seguros, subsidios, servicios públicos)" },
        { value: "salud", label: "Salud (diagnóstico, triaje, tratamiento)" },
        { value: "justicia", label: "Seguridad, policía, migración o justicia" },
        { value: "democracia", label: "Procesos democráticos o electorales" },
        { value: "infraestructura", label: "Infraestructura crítica (energía, agua, transporte)" },
        { value: "biometria", label: "Identificación o categorización biométrica" },
        { value: "ninguno", label: "Ninguno de los anteriores" }
      ]
    },
    {
      id: "r_prohibited", type: "multi", required: true, none: "ninguna",
      text: "¿El sistema hace alguna de estas cosas?",
      help: "Son prácticas prohibidas por el artículo 5 de la Ley de IA de la UE. Si marcas alguna, el resultado será detener.",
      options: [
        { value: "manipulacion", label: "Manipula el comportamiento con técnicas subliminales o engañosas que causan daño" },
        { value: "vulnerabilidades", label: "Explota vulnerabilidades por edad, discapacidad o situación socioeconómica" },
        { value: "puntuacion_social", label: "Asigna una puntuación social que lleva a un trato perjudicial" },
        { value: "prediccion_delito", label: "Predice si alguien cometerá un delito solo por su perfil o personalidad" },
        { value: "scraping_facial", label: "Crea bases de reconocimiento facial con imágenes extraídas masivamente" },
        { value: "emociones", label: "Infiere emociones de personas en el trabajo o en centros educativos" },
        { value: "categorizacion", label: "Deduce raza, opiniones políticas, religión u orientación sexual a partir de biometría" },
        { value: "tiempo_real", label: "Identifica personas por biometría en tiempo real en espacios públicos" },
        { value: "desnudos", label: "Genera imágenes íntimas o sexuales de personas reales sin su consentimiento" },
        { value: "ninguna", label: "Ninguna de las anteriores" }
      ]
    },
    {
      id: "r_autonomy", type: "single",
      text: "¿Qué tanto decide el sistema por sí solo?",
      options: [
        { value: "recomienda", label: "Recomienda y una persona decide" },
        { value: "revisable", label: "Decide, pero una persona revisa y puede revertir" },
        { value: "automatico", label: "Decide sin revisión humana" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_sensitive", type: "single",
      text: "¿Usa datos personales sensibles?",
      help: "Salud, biometría, origen racial o étnico, orientación sexual, creencias, afiliación política o sindical, o datos de niñas, niños y adolescentes (Ley 1581 de 2012, arts. 5 y 7).",
      options: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_vulnerable", type: "single",
      text: "¿Afecta a niñas, niños, adolescentes u otras poblaciones en situación de vulnerabilidad?",
      options: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_reversibility", type: "single",
      text: "Si el sistema se equivoca, ¿qué tan fácil es reparar el daño?",
      options: [
        { value: "facil", label: "Fácil: se corrige rápido y sin perjuicio" },
        { value: "esfuerzo", label: "Con esfuerzo: hay costos o demoras para la persona" },
        { value: "irreversible", label: "Difícil o irreversible" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_interaction", type: "single",
      text: "¿Conversa con personas o genera contenido (texto, imagen, audio o video)?",
      help: "Activa obligaciones de transparencia: avisar que es IA y marcar el contenido sintético (art. 50 de la Ley de IA de la UE).",
      options: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
        { value: "ns", label: "No sé" }
      ]
    },
    {
      id: "r_scale", type: "single",
      text: "¿A cuántas personas puede afectar?",
      options: [
        { value: "pocas", label: "Menos de 100" },
        { value: "cientos", label: "Cientos" },
        { value: "miles", label: "Miles o más" },
        { value: "ns", label: "No sé" }
      ]
    }
  ];

  /* ---------------- Paso 2 · Controles por dimensión HUMANO ----------------
   * critical: niveles de riesgo en los que la pregunta es un control crítico.
   * Un control crítico en "No existe" o "No sé" impide aprobar.
   */
  var DIMENSIONS = [
    {
      id: "H", title: "Humanizar el propósito",
      question: "¿Para qué se utilizará la IA y qué consecuencias puede producir?",
      items: [
        {
          id: "h1", critical: ["alto", "limitado"],
          text: "El propósito, el caso de uso y los límites de uso (qué no debe hacerse con el sistema) están definidos por escrito.",
          rec: "Escribe una declaración de propósito de una página: qué problema resuelve, para quién, qué decisión apoya y qué usos quedan prohibidos.",
          refs: { nist: "MAP", eu: "Art. 9 y 13", oecd: "1.1", unesco: "Proporcionalidad e inocuidad" }
        },
        {
          id: "h2", critical: [],
          text: "Se justificó que usar IA es necesario y proporcional frente a alternativas sin IA.",
          rec: "Compara la solución con IA con al menos una alternativa sin IA y documenta por qué la IA es necesaria e idónea.",
          refs: { nist: "MAP", co: "SIC CE 002/2024: idoneidad, necesidad y proporcionalidad", unesco: "Proporcionalidad e inocuidad" }
        },
        {
          id: "h3", critical: ["alto"],
          text: "Se analizó qué le pasa a una persona ante un falso positivo y ante un falso negativo.",
          rec: "Describe escenarios de error concretos y su costo para la persona; úsalos para elegir umbrales y métricas.",
          refs: { nist: "MAP · MEASURE", eu: "Art. 9", oecd: "1.4" }
        },
        {
          id: "h4", critical: ["alto"],
          text: "Está definido qué decisiones no se automatizan y cuándo la salida es solo una recomendación.",
          rec: "Lista las decisiones que siempre debe tomar una persona y déjalo explícito en la interfaz y en los procedimientos.",
          refs: { nist: "MAP · GOVERN", eu: "Art. 14", unesco: "Supervisión y decisión humanas" }
        }
      ]
    },
    {
      id: "U", title: "Ubicar personas e impactos",
      question: "¿Quién está representado y quién puede verse afectado?",
      items: [
        {
          id: "u1", critical: ["alto", "limitado"],
          text: "Están identificadas las personas y los grupos afectados, incluidos los más vulnerables.",
          rec: "Haz un mapa de personas afectadas: quién usa el sistema, sobre quién decide y quién puede quedar por fuera o salir perjudicado.",
          refs: { nist: "MAP", eu: "Art. 27", oecd: "1.2", unesco: "Equidad y no discriminación" }
        },
        {
          id: "u2", critical: ["alto"],
          text: "El desempeño y los errores se miden por grupo (tasa de selección, falsos positivos y falsos negativos).",
          rec: "Calcula accuracy, tasa de selección, FPR y FNR por grupo relevante; reporta tamaños de muestra e interpreta con cautela los grupos pequeños.",
          refs: { nist: "MEASURE", eu: "Art. 10 y 15", oecd: "1.2", unesco: "Equidad y no discriminación" }
        },
        {
          id: "u3", critical: [],
          text: "Se consultó a personas afectadas o a sus representantes.",
          rec: "Organiza al menos una sesión de consulta con personas afectadas o sus representantes y registra qué cambió a partir de ella.",
          refs: { nist: "GOVERN · MAP", unesco: "Gobernanza y colaboración adaptativas y de múltiples partes" }
        },
        {
          id: "u4", critical: ["alto"],
          text: "Se hizo una evaluación de impacto en derechos y en protección de datos.",
          rec: "Realiza una evaluación de impacto en protección de datos y derechos fundamentales antes de desplegar, y actualízala cuando cambie el sistema.",
          refs: { nist: "MAP", eu: "Art. 27", co: "SIC CE 002/2024: evaluación de impacto", unesco: "Derecho a la intimidad y protección de datos" }
        }
      ]
    },
    {
      id: "M", title: "Minimizar datos y riesgos",
      question: "¿Qué datos son realmente necesarios y qué riesgos pueden introducir?",
      items: [
        {
          id: "m1", critical: ["alto", "limitado"],
          text: "Hay un inventario de datos y cada variable está justificada frente al propósito.",
          rec: "Construye un inventario de variables con su fuente, su finalidad y por qué es necesaria; elimina las que no se justifiquen.",
          refs: { nist: "MAP", eu: "Art. 10", co: "Ley 1581, art. 4: finalidad", unesco: "Derecho a la intimidad y protección de datos" }
        },
        {
          id: "m2", critical: ["alto"],
          text: "Se identificaron los datos sensibles y las variables que pueden funcionar como proxies de ellos.",
          rec: "Marca los atributos sensibles y prueba si otras variables los reconstruyen (proxies); recuerda que quitar el atributo no elimina el sesgo.",
          refs: { nist: "MEASURE", eu: "Art. 10", co: "Ley 1581, arts. 5 y 6", unesco: "Equidad y no discriminación" }
        },
        {
          id: "m3", critical: ["alto", "limitado"],
          text: "Existe base legal o autorización de los titulares para tratar sus datos personales.",
          rec: "Verifica la autorización previa, expresa e informada de los titulares (o la excepción legal que aplique) y conserva prueba de ella.",
          refs: { co: "Ley 1581, art. 9: autorización", eu: "Art. 10", oecd: "1.2", unesco: "Derecho a la intimidad y protección de datos" }
        },
        {
          id: "m4", critical: [],
          text: "Están definidos la retención, el borrado y la seguridad de los datos (cifrado y control de accesos).",
          rec: "Define cuánto tiempo se guardan los datos, cómo se borran y quién accede; cifra en tránsito y en reposo.",
          refs: { nist: "MANAGE", eu: "Art. 15", co: "Ley 1581, art. 4: seguridad", oecd: "1.4" }
        },
        {
          id: "m5", critical: [],
          text: "La procedencia y la calidad de los datos están documentadas.",
          rec: "Documenta de dónde vienen los datos, cuándo se recogieron, para qué y con qué limitaciones (por ejemplo, con una datasheet).",
          refs: { nist: "MAP · MEASURE", eu: "Art. 10", oecd: "1.3" }
        }
      ]
    },
    {
      id: "A", title: "Asegurar autonomía y transparencia",
      question: "¿Podemos explicar y cuestionar las decisiones del sistema?",
      items: [
        {
          id: "a1", critical: ["alto", "limitado"],
          text: "Las personas saben que interactúan con IA o que en su caso intervino un sistema de IA.",
          rec: "Avisa de forma clara y oportuna cuando una persona interactúa con IA o cuando la IA influye en una decisión sobre ella; marca el contenido sintético.",
          refs: { eu: "Art. 26 y 50", oecd: "1.3", unesco: "Transparencia y explicabilidad" }
        },
        {
          id: "a2", critical: ["alto"],
          text: "Las salidas se pueden explicar a quien las recibe, en lenguaje comprensible.",
          rec: "Prepara explicaciones para la persona afectada (qué factores pesaron y qué puede hacer), no solo para el equipo técnico.",
          refs: { nist: "MEASURE", eu: "Art. 13 y 86", oecd: "1.3", unesco: "Transparencia y explicabilidad" }
        },
        {
          id: "a3", critical: ["alto"],
          text: "Hay supervisión humana efectiva: alguien con competencia y autoridad puede revisar, corregir o detener el sistema.",
          rec: "Designa a quién supervisa, con qué formación y con qué autoridad para revertir decisiones o detener el sistema; evita la aprobación automática por costumbre.",
          refs: { nist: "MANAGE", eu: "Art. 14", unesco: "Supervisión y decisión humanas" }
        },
        {
          id: "a4", critical: ["alto"],
          text: "La persona afectada tiene una vía para cuestionar el resultado y pedir revisión humana.",
          rec: "Habilita un canal de reclamo con tiempos de respuesta y revisión por una persona; comunícalo a quienes reciben decisiones.",
          refs: { eu: "Art. 86", co: "Ley 1581, arts. 8 y 15: derechos y reclamos", oecd: "1.3" }
        },
        {
          id: "a5", critical: [],
          text: "Existe documentación técnica o una ficha del modelo (model card) accesible.",
          rec: "Publica o comparte una ficha del modelo: propósito, datos, métricas, métricas por grupo, limitaciones y contacto.",
          refs: { nist: "GOVERN · MAP", eu: "Art. 11", oecd: "1.3" }
        }
      ]
    },
    {
      id: "N", title: "Nombrar responsables",
      question: "¿Quién responde por los datos, el modelo y sus decisiones?",
      items: [
        {
          id: "n1", critical: ["alto", "limitado"],
          text: "Hay una persona responsable del sistema y una matriz de responsabilidades (RACI).",
          rec: "Nombra a la persona responsable (accountable) del sistema y define en una RACI quién responde por datos, modelo, validación y operación.",
          refs: { nist: "GOVERN", eu: "Art. 26", oecd: "1.5", unesco: "Responsabilidad y rendición de cuentas" }
        },
        {
          id: "n2", critical: ["alto"],
          text: "Está definido quién aprueba el despliegue y quién puede detener el sistema.",
          rec: "Define por escrito quién aprueba la puesta en producción y quién tiene la autoridad (y el procedimiento) para apagarlo.",
          refs: { nist: "GOVERN · MANAGE", eu: "Art. 14", oecd: "1.5" }
        },
        {
          id: "n3", critical: [],
          text: "Hay un canal y un responsable para reclamaciones e incidentes, con escalamiento.",
          rec: "Crea un procedimiento de incidentes: cómo se reporta, quién responde, en cuánto tiempo y cuándo se escala.",
          refs: { nist: "MANAGE", eu: "Art. 73", co: "Ley 1581, art. 15", oecd: "1.5" }
        },
        {
          id: "n4", critical: [],
          text: "Los proveedores externos (modelos, API, datos) se evaluaron y sus responsabilidades están en contrato.",
          rec: "Evalúa a cada proveedor de modelos, API o datos y deja en el contrato quién responde por qué, incluido el uso de tus datos.",
          refs: { nist: "GOVERN", eu: "Art. 25", co: "SIC CE 002/2024" }
        },
        {
          id: "n5", critical: [],
          text: "Quienes operan el sistema recibieron formación sobre su uso, sus límites y sus riesgos.",
          rec: "Forma a quienes operan y supervisan el sistema: qué hace, cuándo no confiar en él y cómo reportar problemas.",
          refs: { nist: "GOVERN", eu: "Art. 4", unesco: "Sensibilización y alfabetización" }
        }
      ]
    },
    {
      id: "O", title: "Observar, auditar y corregir",
      question: "¿El sistema funciona de manera consistente y qué hacemos cuando encontramos diferencias?",
      items: [
        {
          id: "o1", critical: ["alto"],
          text: "En operación se monitorean el desempeño, la deriva y los errores por grupo.",
          rec: "Define indicadores de monitoreo (incluidos los de equidad por grupo), umbrales de alerta y quién los revisa.",
          refs: { nist: "MEASURE · MANAGE", eu: "Art. 72", oecd: "1.4" }
        },
        {
          id: "o2", critical: ["alto"],
          text: "Se registran las decisiones, las versiones de modelos o prompts y los cambios.",
          rec: "Guarda registros (logs) de entradas, salidas, versiones y cambios, con un periodo de conservación definido.",
          refs: { nist: "MANAGE", eu: "Art. 12", oecd: "1.5" }
        },
        {
          id: "o3", critical: ["alto", "limitado"],
          text: "Antes de desplegar se probó con casos límite, robustez y seguridad (y alucinaciones, si aplica).",
          rec: "Prueba con casos límite, datos adversos y escenarios de abuso; documenta resultados y criterios de aceptación.",
          refs: { nist: "MEASURE", eu: "Art. 15", oecd: "1.4", unesco: "Seguridad y protección" }
        },
        {
          id: "o4", critical: [],
          text: "Hay un plan de respuesta: alternativa sin IA, reversión y nueva auditoría tras cada corrección.",
          rec: "Define el plan B cuando la IA falle, cómo revertir cambios y la regla de volver a auditar después de cada intervención.",
          refs: { nist: "MANAGE", eu: "Art. 9", oecd: "1.4" }
        },
        {
          id: "o5", critical: [],
          text: "Hay una fecha definida para la próxima revisión del sistema.",
          rec: "Agenda revisiones periódicas (y extraordinarias ante cambios de datos, población o contexto).",
          refs: { nist: "GOVERN", eu: "Art. 9" }
        }
      ]
    }
  ];

  /* ---------------- Detector de vacíos (descripción libre) ---------------- */
  var GAP_TOPICS = [
    { dim: "H", id: "proposito", label: "Propósito u objetivo", terms: ["proposito", "objetivo", "finalidad", "para que sirve", "busca"] , q: "h1" },
    { dim: "H", id: "limites", label: "Límites de uso", terms: ["limite", "no debe usarse", "no se usara", "fuera de alcance", "restriccion", "prohibido"], q: "h1" },
    { dim: "U", id: "afectados", label: "Personas afectadas", terms: ["usuario", "persona", "cliente", "ciudadan", "estudiante", "paciente", "trabajador", "empleado", "colaborador", "beneficiari", "candidat"], q: "u1" },
    { dim: "U", id: "grupos", label: "Diferencias entre grupos o sesgos", terms: ["sesgo", "por grupo", "equidad", "discrimin", "genero", "edad", "etni", "region"], q: "u2" },
    { dim: "M", id: "datos", label: "Qué datos usa", terms: ["dato", "dataset", "base de datos", "crm", "historial", "registro"], q: "m1" },
    { dim: "M", id: "autorizacion", label: "Autorización o base legal", terms: ["consentimiento", "autorizacion", "habeas data", "1581", "base legal", "aviso de privacidad"], q: "m3" },
    { dim: "A", id: "aviso", label: "Aviso de que es IA", terms: ["se informa", "aviso", "sabe que es ia", "transparen", "se comunica"], q: "a1" },
    { dim: "A", id: "explicacion", label: "Explicación de resultados", terms: ["explica", "trazab", "interpretab", "justifica"], q: "a2" },
    { dim: "A", id: "supervision", label: "Supervisión humana", terms: ["aprobacion humana", "revision humana", "humano en el", "supervision", "una persona aprueba", "una persona revisa", "valida un", "revisa", "aprueba"], q: "a3" },
    { dim: "A", id: "apelacion", label: "Vía para reclamar o apelar", terms: ["apelac", "reclamo", "impugn", "pqr", "solicitar revision", "pedir revision", "pida revision", "via para que"], q: "a4" },
    { dim: "N", id: "responsable", label: "Responsable del sistema", terms: ["responsable", "dueno", "owner", "raci", "comite", "accountable", "lider del"], q: "n1" },
    { dim: "O", id: "monitoreo", label: "Monitoreo", terms: ["monitoreo", "monitorea", "seguimiento", "deriva", "drift", "alerta", "metrica"], q: "o1" },
    { dim: "O", id: "registro", label: "Registro y auditoría", terms: ["registro", "log", "bitacora", "auditor", "version"], q: "o2" },
    { dim: "O", id: "pruebas", label: "Pruebas antes de desplegar", terms: ["prueba", "test", "validacion", "piloto", "casos limite"], q: "o3" },
    { dim: "O", id: "plan_b", label: "Plan B o reversión", terms: ["fallback", "plan b", "respaldo", "rollback", "contingencia", "revertir"], q: "o4" }
  ];

  /* Palabras que sugieren revisar el Paso 1 */
  var RISK_SIGNALS = [
    { label: "datos de salud", terms: ["salud", "diagnost", "historia clinica", "paciente"] },
    { label: "biometría", terms: ["biometr", "reconocimiento facial", "huella", "rostro", "voz del"] },
    { label: "niñas, niños o adolescentes", terms: ["menor", "nino", "nina", "adolescente", "colegio", "estudiantes de basica"] },
    { label: "decisiones laborales", terms: ["contrata", "seleccion de personal", "hoja de vida", "despid", "desempeno laboral", "candidat"] },
    { label: "crédito o acceso a servicios", terms: ["credito", "prestamo", "scoring", "subsidio", "seguro"] },
    { label: "vigilancia o perfilamiento", terms: ["vigilancia", "perfilamiento", "perfilar", "rastreo", "monitorear empleados"] },
    { label: "emociones", terms: ["emocion", "estado de animo"] }
  ];

  var MODEL = {
    version: "2.0.0",
    frameworks: FRAMEWORKS,
    scale: SCALE,
    risk: RISK,
    dimensions: DIMENSIONS,
    gapTopics: GAP_TOPICS,
    riskSignals: RISK_SIGNALS
  };

  if (typeof module === "object" && module.exports) module.exports = MODEL;
  else root.LAA_MODEL = MODEL;
})(typeof window !== "undefined" ? window : this);

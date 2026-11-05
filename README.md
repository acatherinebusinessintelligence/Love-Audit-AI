# 💜 Love Audit AI

**Autoevaluación de sistemas de IA centrada en las personas, basada en el framework [HUMANO](https://doi.org/10.5281/zenodo.22285253).**

👉 Úsala aquí: https://acatherinebusinessintelligence.github.io/Love-Audit-AI/

Love Audit AI ayuda a equipos, docentes y estudiantes a revisar un sistema de inteligencia artificial antes de usarlo sobre personas. No da un puntaje mágico: separa **qué tan delicado es el uso** de **qué evidencia existe de los controles**, y con reglas explícitas propone una decisión y un plan de acción.

> Herramienta educativa. No es certificación, auditoría independiente ni asesoría legal. Todo corre en tu navegador: nada se envía a ningún servidor.

## Cómo funciona

| Paso | Qué haces | Qué obtienes |
|---|---|---|
| 0 · Describe el sistema | Escribes qué hace, para quién y con qué datos | Un **detector de vacíos** que señala los temas que no mencionas o que mencionas como ausentes («sin consentimiento») |
| 1 · Riesgo del caso de uso | Respondes 9 preguntas sobre a quién afecta y cómo | Nivel de riesgo **inaceptable, alto, limitado o mínimo**, con sus razones |
| 2 · Controles HUMANO | Calificas 28 controles en las seis dimensiones H-U-M-A-N-O con niveles de evidencia (no existe, declarado, documentado, verificado, no sé, no aplica) | Evidencia por dimensión y **controles críticos** según el riesgo |
| 3 · Plan de acción | — | **Decisión orientativa** (aprobar, aprobar con condiciones, no aprobar todavía) y acciones priorizadas, cada una con su correspondencia en NIST AI RMF, Ley de IA de la UE, normativa colombiana, OCDE y UNESCO |

Puedes descargar el reporte en HTML o Markdown, y guardar tus respuestas en JSON para retomarlas: **auditar → intervenir → volver a auditar**.

## Las seis dimensiones de HUMANO

| | Dimensión | Pregunta central |
|---|---|---|
| **H** | Humanizar el propósito | ¿Para qué se utilizará la IA y qué consecuencias puede producir? |
| **U** | Ubicar personas e impactos | ¿Quién está representado y quién puede verse afectado? |
| **M** | Minimizar datos y riesgos | ¿Qué datos son realmente necesarios y qué riesgos pueden introducir? |
| **A** | Asegurar autonomía y transparencia | ¿Podemos explicar y cuestionar las decisiones del sistema? |
| **N** | Nombrar responsables | ¿Quién responde por los datos, el modelo y sus decisiones? |
| **O** | Observar, auditar y corregir | ¿El sistema funciona de manera consistente y qué hacemos cuando encontramos diferencias? |

## Metodología

Las reglas de clasificación, los controles críticos, las reglas de decisión, la tabla completa de correspondencias y las limitaciones están en **[METODOLOGIA.md](METODOLOGIA.md)**.

## Estructura del repositorio

```text
docs/                 Sitio publicado en GitHub Pages
  index.html          Interfaz
  questions.js        Modelo: preguntas, recomendaciones y correspondencias con marcos
  engine.js           Motor de reglas (funciones puras, sin acceso a la página)
  app.js              Interacción, reporte y exportación
  styles.css
tests/run.js          Pruebas del motor (node tests/run.js)
METODOLOGIA.md        Reglas, controles y marcos de referencia
CHANGELOG.md          Cambios por versión
```

Las pruebas cubren la clasificación del riesgo, las reglas de decisión, el detector de vacíos y la integridad del modelo. Incluyen los casos que fallaban en la versión 1, y corren en cada cambio con GitHub Actions.

## Privacidad

- La página no usa analítica, cookies, fuentes externas ni servicios de terceros.
- Las respuestas se guardan solo en el almacenamiento local de tu navegador. «Empezar de nuevo» las borra.
- Los archivos que exportas o importas no salen de tu equipo.

## Autoría y citación

Creado por **Alejandra Catherine Montaña Acevedo** · [DraCorazónIA](https://acatherinebusinessintelligence.github.io/)

Los metadatos de citación están en [`CITATION.cff`](CITATION.cff). Si usas la herramienta, cita también el framework:

Montaña Acevedo, A. C. (2026). *HUMANO: Framework metodológico para diseñar y auditar sistemas de inteligencia artificial centrados en las personas* (v1.0.0). Zenodo. https://doi.org/10.5281/zenodo.22285253

## Licencias

- Código: [MIT](LICENSE).
- Metodología y documentación (preguntas, reglas y correspondencias): [CC BY 4.0](LICENSE-DOCS.md).

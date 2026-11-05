# Changelog

Registro de cambios de Love Audit AI. El formato se inspira en Keep a Changelog.

## [2.0.0] - 2026-11-05

Rediseño completo sobre el framework HUMANO.

### Added

- **Paso 1 · Riesgo del caso de uso:** clasificación en inaceptable, alto, limitado o mínimo, con reglas explícitas inspiradas en la Ley de IA de la UE (art. 5 y Anexo III) y la Ley 1581 de 2012.
- **Paso 2 · Controles HUMANO:** 28 controles en las seis dimensiones H-U-M-A-N-O, calificados con los niveles de evidencia de HUMANO, más «No sé» (vacío de evidencia) y «No aplica».
- Controles críticos según el nivel de riesgo.
- Decisión orientativa (aprobar, aprobar con condiciones, no aprobar todavía, detener) con reglas publicadas.
- Plan de acción priorizado con recomendaciones por control.
- Correspondencia orientativa de cada control con NIST AI RMF, Ley de IA de la UE, normativa colombiana (Ley 1581, Circular Externa 002 de 2024 de la SIC), Principios de IA de la OCDE y Recomendación de la UNESCO.
- Reporte descargable en HTML y Markdown con fecha, versión, autoría, decisión, plan y limitaciones.
- Exportar e importar respuestas en JSON, y guardado automático en el navegador.
- Dos ejemplos: agente de ventas (riesgo limitado) y preselección de hojas de vida (riesgo alto).
- Pruebas automáticas del motor (`tests/run.js`) y GitHub Actions.
- README, METODOLOGIA, CHANGELOG, licencias (MIT para código, CC BY 4.0 para metodología) y CITATION.cff.

### Changed

- El modo libre ya no da puntaje: ahora es un **detector de vacíos** que distingue temas mencionados, mencionados como ausentes y no mencionados.
- El riesgo y la madurez de controles se reportan por separado; ya no se mezclan en un solo número.
- Los resultados muestran los títulos de las dimensiones, no los nombres internos.
- La página no carga recursos externos.

### Fixed

Errores de la versión 1, verificados en el navegador y cubiertos por pruebas:

- Un sistema con daño potencial alto y buenos controles salía «Bajo riesgo» (96/100).
- Responder una sola pregunta daba «Crítico (rediseño requerido)», porque lo no respondido contaba como cero.
- Escribir «hola» daba 60/100; un sistema de vigilancia laboral sin consentimiento, 50/100; y uno con buenas prácticas, 61/100. Los tres salían «Riesgo alto».
- «Sin consentimiento» contaba a la vez como riesgo y como buena práctica.
- El botón «Usar modo guiado» no funcionaba al abrir la página y acumulaba copias de su acción en cada cálculo.
- El marcador dentro del cuestionario quedaba siempre en 0/20.
- El modo guiado no mostraba recomendaciones.

## [1.0.0] - 2026-02-13

- Primera versión: cinco dimensiones, cuestionario guiado, modo libre por palabras clave y exportación a Markdown y HTML.

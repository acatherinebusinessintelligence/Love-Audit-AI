# Metodología de Love Audit AI v2

Love Audit AI aplica el framework [HUMANO](https://doi.org/10.5281/zenodo.22285253) como una autoevaluación guiada. Esta página explica las preguntas, las reglas y sus límites, para que cualquiera pueda revisarlas, discutirlas y adaptarlas.

> Herramienta educativa. No es certificación, auditoría independiente ni asesoría legal. Las correspondencias con marcos externos son orientativas: indican dónde se trata un tema parecido, no cumplimiento ni equivalencia legal.

## 1. Principio de diseño: separar riesgo y controles

La versión 1 sumaba en un solo número qué tan riesgoso era el uso y qué tan buenos eran los controles. Por eso un sistema con daño potencial alto podía salir «bajo riesgo» si tenía buenos controles. La versión 2 separa las dos preguntas:

1. **Riesgo del caso de uso (Paso 1):** cuánto puede afectar a las personas, sin importar qué tan bien esté hecho el sistema.
2. **Evidencia de controles (Paso 2):** qué existe hoy, medido con los niveles de evidencia de HUMANO.
3. **Decisión (orientativa):** combina ambos con reglas explícitas. Un buen promedio no compensa un control crítico ausente.

## 2. Clasificación del riesgo

| Nivel | Cuándo |
|---|---|
| **Inaceptable** | El sistema hace alguna de las prácticas prohibidas por el art. 5 de la Ley de IA de la UE: manipulación dañina, explotación de vulnerabilidades, puntuación social, predicción de delitos solo por perfil, extracción masiva de imágenes faciales, inferencia de emociones en el trabajo o la educación, categorización biométrica de atributos sensibles o identificación biométrica remota en tiempo real en espacios públicos. Se incluye además la generación de imágenes íntimas de personas reales sin consentimiento. |
| **Alto** | Usa biometría; o influye en decisiones sobre personas en un ámbito del Anexo III de la Ley de IA de la UE (empleo, educación, servicios esenciales, seguridad y justicia, migración, procesos democráticos, infraestructura crítica) o en salud; o un error puede causar un daño irreversible; o decide sin revisión humana sobre datos sensibles o poblaciones vulnerables; o combina datos sensibles con poblaciones vulnerables. |
| **Limitado** | Influye en decisiones sobre personas fuera de esos ámbitos, usa datos sensibles (Ley 1581 de 2012, arts. 5 y 7), afecta a poblaciones vulnerables, conversa con personas o genera contenido (obligaciones de transparencia del art. 50 de la Ley de IA de la UE), o no está claro que los errores se puedan reparar. |
| **Mínimo** | Ninguna de las anteriores. |

Las respuestas «No sé» se tratan de forma conservadora: cuentan como si la condición pudiera cumplirse, y el resultado lo indica.

## 3. Niveles de evidencia (Paso 2)

Cada control se responde con la escala de evidencia de HUMANO:

| Valor | Nivel | Significado |
|---|---|---|
| 0 | No existe | No se ha hecho. |
| 1 | Declarado | Se dice o se hace, pero no está documentado (evidencia descriptiva). |
| 2 | Documentado o medido | Hay un documento, una métrica o un registro verificable. |
| 3 | Verificado | Se revisó, se intervino cuando hizo falta y se volvió a medir. |
| — | No sé | Vacío de evidencia: no suma ni resta, pero se reporta y puede impedir aprobar. |
| — | No aplica | Se excluye del cálculo y queda listado para justificarlo en el reporte. |

El promedio por dimensión usa solo las respuestas 0–3.

## 4. Controles críticos

Cada control indica en qué niveles de riesgo es crítico. Un control crítico en «No existe», «No sé» o sin responder impide aprobar. La lista completa está en la sección 7.

## 5. Reglas de decisión

| Riesgo | No aprobar todavía | Aprobar con condiciones | Aprobar |
|---|---|---|---|
| Inaceptable | — (siempre **No aprobar: posible práctica prohibida**) | — | — |
| Alto | Hay al menos un control crítico pendiente | Críticos cubiertos, pero alguna dimensión por debajo de 2 o algún «No sé» | Críticos cubiertos, todas las dimensiones ≥ 2 y sin «No sé» |
| Limitado | Dos o más controles críticos en «No existe» | Algún crítico pendiente, o alguna dimensión por debajo de 1,5 | Críticos cubiertos y todas las dimensiones ≥ 1,5 |
| Mínimo | — | Alguna dimensión por debajo de 1 o sin evaluar | Todas las dimensiones ≥ 1 |

Además, «Aprobar» baja a «Aprobar con condiciones» si faltan respuestas o si hubo «No sé» al clasificar el riesgo.

El porcentaje de **madurez de controles** (promedio de las dimensiones sobre 3) es solo informativo y no interviene en la decisión.

Como dice HUMANO, la decisión es un juicio informado y contextual, no un sello técnico. Las reglas sirven para que ese juicio sea explícito y discutible.

## 6. Detector de vacíos

El modo libre de la versión 1 calificaba la descripción contando palabras, y llegaba a dar el mismo puntaje a «hola» que a un sistema de vigilancia laboral sin consentimiento. En la versión 2 la descripción **no se califica**. El detector solo indica, para quince temas de HUMANO, si la descripción los menciona, los menciona como ausentes («sin consentimiento», «no hay responsable») o no los menciona. También señala palabras que sugieren revisar el Paso 1 (salud, biometría, menores, decisiones laborales, crédito, vigilancia, emociones).

Para detectar la negación, el texto se divide en cláusulas (punto, coma, punto y coma, dos puntos, salto de línea o «pero»). En cada cláusula se busca la primera mención del tema; si hay una negación en las cinco palabras anteriores, esa cláusula lo cuenta como ausente. Es una heurística: puede equivocarse con frases complejas, y por eso no decide nada.

## 7. Controles y correspondencias

### H — Humanizar el propósito

*¿Para qué se utilizará la IA y qué consecuencias puede producir?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| h1 | El propósito, el caso de uso y los límites de uso (qué no debe hacerse con el sistema) están definidos por escrito. | alto, limitado | MAP | Art. 9 y 13 | — | 1.1 | Proporcionalidad e inocuidad |
| h2 | Se justificó que usar IA es necesario y proporcional frente a alternativas sin IA. | — | MAP | — | SIC CE 002/2024: idoneidad, necesidad y proporcionalidad | — | Proporcionalidad e inocuidad |
| h3 | Se analizó qué le pasa a una persona ante un falso positivo y ante un falso negativo. | alto | MAP · MEASURE | Art. 9 | — | 1.4 | — |
| h4 | Está definido qué decisiones no se automatizan y cuándo la salida es solo una recomendación. | alto | MAP · GOVERN | Art. 14 | — | — | Supervisión y decisión humanas |

### U — Ubicar personas e impactos

*¿Quién está representado y quién puede verse afectado?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| u1 | Están identificadas las personas y los grupos afectados, incluidos los más vulnerables. | alto, limitado | MAP | Art. 27 | — | 1.2 | Equidad y no discriminación |
| u2 | El desempeño y los errores se miden por grupo (tasa de selección, falsos positivos y falsos negativos). | alto | MEASURE | Art. 10 y 15 | — | 1.2 | Equidad y no discriminación |
| u3 | Se consultó a personas afectadas o a sus representantes. | — | GOVERN · MAP | — | — | — | Gobernanza y colaboración adaptativas y de múltiples partes |
| u4 | Se hizo una evaluación de impacto en derechos y en protección de datos. | alto | MAP | Art. 27 | SIC CE 002/2024: evaluación de impacto | — | Derecho a la intimidad y protección de datos |

### M — Minimizar datos y riesgos

*¿Qué datos son realmente necesarios y qué riesgos pueden introducir?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| m1 | Hay un inventario de datos y cada variable está justificada frente al propósito. | alto, limitado | MAP | Art. 10 | Ley 1581, art. 4: finalidad | — | Derecho a la intimidad y protección de datos |
| m2 | Se identificaron los datos sensibles y las variables que pueden funcionar como proxies de ellos. | alto | MEASURE | Art. 10 | Ley 1581, arts. 5 y 6 | — | Equidad y no discriminación |
| m3 | Existe base legal o autorización de los titulares para tratar sus datos personales. | alto, limitado | — | Art. 10 | Ley 1581, art. 9: autorización | 1.2 | Derecho a la intimidad y protección de datos |
| m4 | Están definidos la retención, el borrado y la seguridad de los datos (cifrado y control de accesos). | — | MANAGE | Art. 15 | Ley 1581, art. 4: seguridad | 1.4 | — |
| m5 | La procedencia y la calidad de los datos están documentadas. | — | MAP · MEASURE | Art. 10 | — | 1.3 | — |

### A — Asegurar autonomía y transparencia

*¿Podemos explicar y cuestionar las decisiones del sistema?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| a1 | Las personas saben que interactúan con IA o que en su caso intervino un sistema de IA. | alto, limitado | — | Art. 26 y 50 | — | 1.3 | Transparencia y explicabilidad |
| a2 | Las salidas se pueden explicar a quien las recibe, en lenguaje comprensible. | alto | MEASURE | Art. 13 y 86 | — | 1.3 | Transparencia y explicabilidad |
| a3 | Hay supervisión humana efectiva: alguien con competencia y autoridad puede revisar, corregir o detener el sistema. | alto | MANAGE | Art. 14 | — | — | Supervisión y decisión humanas |
| a4 | La persona afectada tiene una vía para cuestionar el resultado y pedir revisión humana. | alto | — | Art. 86 | Ley 1581, arts. 8 y 15: derechos y reclamos | 1.3 | — |
| a5 | Existe documentación técnica o una ficha del modelo (model card) accesible. | — | GOVERN · MAP | Art. 11 | — | 1.3 | — |

### N — Nombrar responsables

*¿Quién responde por los datos, el modelo y sus decisiones?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| n1 | Hay una persona responsable del sistema y una matriz de responsabilidades (RACI). | alto, limitado | GOVERN | Art. 26 | — | 1.5 | Responsabilidad y rendición de cuentas |
| n2 | Está definido quién aprueba el despliegue y quién puede detener el sistema. | alto | GOVERN · MANAGE | Art. 14 | — | 1.5 | — |
| n3 | Hay un canal y un responsable para reclamaciones e incidentes, con escalamiento. | — | MANAGE | Art. 73 | Ley 1581, art. 15 | 1.5 | — |
| n4 | Los proveedores externos (modelos, API, datos) se evaluaron y sus responsabilidades están en contrato. | — | GOVERN | Art. 25 | SIC CE 002/2024 | — | — |
| n5 | Quienes operan el sistema recibieron formación sobre su uso, sus límites y sus riesgos. | — | GOVERN | Art. 4 | — | — | Sensibilización y alfabetización |

### O — Observar, auditar y corregir

*¿El sistema funciona de manera consistente y qué hacemos cuando encontramos diferencias?*

| Id | Control | Crítico en riesgo | NIST AI RMF | Ley de IA UE | Colombia | OCDE | UNESCO |
|---|---|---|---|---|---|---|---|
| o1 | En operación se monitorean el desempeño, la deriva y los errores por grupo. | alto | MEASURE · MANAGE | Art. 72 | — | 1.4 | — |
| o2 | Se registran las decisiones, las versiones de modelos o prompts y los cambios. | alto | MANAGE | Art. 12 | — | 1.5 | — |
| o3 | Antes de desplegar se probó con casos límite, robustez y seguridad (y alucinaciones, si aplica). | alto, limitado | MEASURE | Art. 15 | — | 1.4 | Seguridad y protección |
| o4 | Hay un plan de respuesta: alternativa sin IA, reversión y nueva auditoría tras cada corrección. | — | MANAGE | Art. 9 | — | 1.4 | — |
| o5 | Hay una fecha definida para la próxima revisión del sistema. | — | GOVERN | Art. 9 | — | — | — |

## 8. Marcos de referencia y estado normativo

Revisado en noviembre de 2026. Verifica el estado vigente antes de tomar decisiones legales.

- **NIST AI Risk Management Framework 1.0 (2023).** Marco voluntario con cuatro funciones: Gobernar (GOVERN), Mapear (MAP), Medir (MEASURE) y Gestionar (MANAGE). Las correspondencias se indican por función. https://www.nist.gov/itl/ai-risk-management-framework
- **Ley de IA de la UE — Reglamento (UE) 2024/1689.** Aplica a sistemas que se ofrecen o se usan en la UE; aquí se usa como referencia de buenas prácticas. Las prácticas prohibidas aplican desde el 2 de febrero de 2025. Con el Ómnibus Digital sobre IA, aprobado en 2026, las obligaciones para sistemas de alto riesgo del Anexo III aplican desde el 2 de diciembre de 2027, y las de sistemas integrados en productos regulados (Anexo I), desde el 2 de agosto de 2028. https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689
- **Colombia.**
  - Ley Estatutaria 1581 de 2012 de protección de datos personales: principios, datos sensibles, autorización, derechos y reclamos.
  - Circular Externa 002 del 21 de agosto de 2024 de la Superintendencia de Industria y Comercio: lineamientos para el tratamiento de datos personales en sistemas de IA (idoneidad, necesidad, razonabilidad y proporcionalidad; privacidad desde el diseño; evaluación de impacto).
  - CONPES 4144 de 2025: Política Nacional de Inteligencia Artificial.
  - Ley de IA: Colombia no tiene todavía una ley de IA aprobada. El Proyecto de Ley 043 de 2025 Senado – 324 de 2025 Cámara se archivó por tránsito de legislatura, y un nuevo proyecto está en trámite en la legislatura 2026–2030.
- **Principios de IA de la OCDE (2019, actualizados en 2024).** 1.1 crecimiento inclusivo y bienestar; 1.2 Estado de derecho, derechos humanos y valores democráticos, incluidas la equidad y la privacidad; 1.3 transparencia y explicabilidad; 1.4 robustez, seguridad y protección; 1.5 rendición de cuentas. https://oecd.ai/en/ai-principles
- **Recomendación de la UNESCO sobre la Ética de la IA (2021).** Las correspondencias usan los nombres de sus principios (proporcionalidad e inocuidad, seguridad y protección, intimidad y protección de datos, gobernanza de múltiples partes, responsabilidad y rendición de cuentas, transparencia y explicabilidad, supervisión y decisión humanas, sensibilización y alfabetización, equidad y no discriminación). https://www.unesco.org/es/artificial-intelligence/recommendation-ethics

## 9. Limitaciones

- Es una autoevaluación: depende de la honestidad y la evidencia de quien responde.
- No sustituye una auditoría independiente, una evaluación de impacto formal ni una opinión jurídica.
- No garantiza ausencia de sesgos ni de daños.
- Las reglas de decisión y los controles críticos son una propuesta metodológica: deben adaptarse al sector y al contexto.
- Las correspondencias con marcos externos son una guía de lectura, no un análisis de cumplimiento.
- El detector de vacíos es una heurística en español y puede equivocarse con frases complejas.

## 10. Cómo proponer cambios

Las preguntas y correspondencias están en `docs/questions.js` y las reglas en `docs/engine.js`. Cualquier cambio debe acompañarse de una prueba en `tests/run.js` (`node tests/run.js`), que también corre en GitHub Actions.

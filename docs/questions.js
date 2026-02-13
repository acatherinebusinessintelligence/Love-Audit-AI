window.QUESTIONNAIRE = [
  {
    dimension: "impacto_humano",
    title: "Impacto humano",
    questions: [
      {
        id: "ih_1",
        text: "¿Quién toma la decisión final?",
        options: [
          { label: "IA automática", score: 0 },
          { label: "IA con intervención ocasional", score: 1 },
          { label: "Humano aprueba siempre", score: 4 }
        ]
      },
      {
        id: "ih_2",
        text: "¿Existe mecanismo de apelación/revisión?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí, documentado", score: 4 }
        ]
      },
      {
        id: "ih_3",
        text: "¿El error puede causar daño material a una persona?",
        options: [
          { label: "Alto", score: 0 },
          { label: "Medio", score: 2 },
          { label: "Bajo", score: 4 }
        ]
      },
      {
        id: "ih_4",
        text: "¿Se evalúan sesgos por grupos cuando aplica?",
        options: [
          { label: "No", score: 0 },
          { label: "A veces", score: 2 },
          { label: "Sí, con métricas", score: 4 }
        ]
      },
      {
        id: "ih_5",
        text: "¿Se informa claramente al usuario que hay IA?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      }
    ]
  },

  {
    dimension: "transparencia",
    title: "Transparencia",
    questions: [
      {
        id: "tr_1",
        text: "¿Se puede explicar por qué el sistema produjo una respuesta/decisión?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí, con trazabilidad", score: 4 }
        ]
      },
      {
        id: "tr_2",
        text: "¿Se registran prompts, versiones de modelo y cambios de reglas?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí, auditado", score: 4 }
        ]
      },
      {
        id: "tr_3",
        text: "¿Se comunica incertidumbre y límites de uso (qué NO hacer)?",
        options: [
          { label: "No", score: 0 },
          { label: "A veces", score: 2 },
          { label: "Sí, explícito", score: 4 }
        ]
      },
      {
        id: "tr_4",
        text: "¿Existe documentación accesible para usuarios/operación?",
        options: [
          { label: "No", score: 0 },
          { label: "Básica", score: 2 },
          { label: "Completa", score: 4 }
        ]
      },
      {
        id: "tr_5",
        text: "¿Hay logging de decisiones clave para auditoría?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      }
    ]
  },

  {
    dimension: "privacidad_datos",
    title: "Privacidad y datos",
    questions: [
      {
        id: "pd_1",
        text: "¿Se minimizan datos (solo lo necesario) y se separa PII?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "pd_2",
        text: "¿Existe base legal/consentimiento cuando aplica?",
        options: [
          { label: "No", score: 0 },
          { label: "No siempre", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "pd_3",
        text: "¿Hay retención/borrado definido y documentado?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "pd_4",
        text: "¿Se cifran datos en tránsito y en reposo?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "pd_5",
        text: "¿Se realizó evaluación de impacto (DPIA) cuando aplica?",
        options: [
          { label: "No", score: 0 },
          { label: "En evaluación", score: 2 },
          { label: "Sí", score: 4 }
        ]
      }
    ]
  },

  {
    dimension: "robustez_tecnica",
    title: "Robustez técnica",
    questions: [
      {
        id: "rt_1",
        text: "¿Hay pruebas (unitarias + casos límite) para el sistema?",
        options: [
          { label: "No", score: 0 },
          { label: "Básicas", score: 2 },
          { label: "Sí, sistemáticas", score: 4 }
        ]
      },
      {
        id: "rt_2",
        text: "¿Hay monitoreo y alertas en producción?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "rt_3",
        text: "¿Existe fallback cuando la IA está insegura o falla?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "rt_4",
        text: "¿Se evalúa deriva de datos / desempeño por segmento?",
        options: [
          { label: "No", score: 0 },
          { label: "A veces", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "rt_5",
        text: "¿Se controlan alucinaciones con guardrails/policies?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      }
    ]
  },

  {
    dimension: "gobernanza_cumplimiento",
    title: "Gobernanza y cumplimiento",
    questions: [
      {
        id: "gc_1",
        text: "¿Hay un responsable/accountable definido (RACI)?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "gc_2",
        text: "¿Existe política de uso (qué se permite / qué no)?",
        options: [
          { label: "No", score: 0 },
          { label: "Básica", score: 2 },
          { label: "Sí, formal", score: 4 }
        ]
      },
      {
        id: "gc_3",
        text: "¿Se hacen revisiones periódicas de riesgos y controles?",
        options: [
          { label: "No", score: 0 },
          { label: "Ocasional", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "gc_4",
        text: "¿Hay control de acceso y trazabilidad de cambios?",
        options: [
          { label: "No", score: 0 },
          { label: "Parcial", score: 2 },
          { label: "Sí", score: 4 }
        ]
      },
      {
        id: "gc_5",
        text: "¿Cumple con normativa aplicable y lineamientos internos?",
        options: [
          { label: "No claro", score: 0 },
          { label: "En proceso", score: 2 },
          { label: "Sí", score: 4 }
        ]
      }
    ]
  }
];

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
      }
    ]
  },
  // ...repites para las otras 4 dimensiones
];


export default {
  docs: [
    {
      type: "doc",
      id: "introducao",
      label: "Introducao",
    },
    {
      type: "category",
      label: "Arquitetura",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "arquitetura/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "arquitetura/type-system",
          label: "Sistema de Tipos",
        },
      ],
    },
    {
      type: "category",
      label: "Result Pattern",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "result/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "result/api",
          label: "API Completa",
        },
      ],
    },
    {
      type: "category",
      label: "Schema Builder",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "schema/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "schema/compile",
          label: "Compilacao e Modos",
        },
        {
          type: "doc",
          id: "schema/tipos",
          label: "Inferencia de Tipos",
        },
      ],
    },
    {
      type: "category",
      label: "Type Fields",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "type-fields/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "type-fields/string",
          label: "Strings",
        },
        {
          type: "doc",
          id: "type-fields/numerico",
          label: "Numericos",
        },
        {
          type: "doc",
          id: "type-fields/data",
          label: "Datas",
        },
        {
          type: "doc",
          id: "type-fields/identificador",
          label: "Identificadores",
        },
        {
          type: "doc",
          id: "type-fields/outros",
          label: "Outros",
        },
      ],
    },
    {
      type: "category",
      label: "Domain Models",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "domain-models/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "domain-models/entity",
          label: "Entity",
        },
        {
          type: "doc",
          id: "domain-models/value-object",
          label: "Value Object",
        },
        {
          type: "doc",
          id: "domain-models/aggregate",
          label: "Aggregate",
        },
        {
          type: "doc",
          id: "domain-models/dto",
          label: "Dto",
        },
      ],
    },
    {
      type: "category",
      label: "Exceptions",
      collapsed: false,
      items: [
        {
          type: "doc",
          id: "exceptions/visao-geral",
          label: "Visao Geral",
        },
        {
          type: "doc",
          id: "exceptions/tipos",
          label: "Tipos de Excecao",
        },
      ],
    },
  ],
};

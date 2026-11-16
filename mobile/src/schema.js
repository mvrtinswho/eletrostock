export const sections = {
  materiais: {
    title: "Materiais",
    singular: "Material",
    icon: "▦",
    description: "Catálogo e níveis de estoque",
    fields: [
      { key: "codigo", label: "Código" },
      { key: "nome", label: "Nome do material" },
      { key: "categoria", label: "Categoria", relation: "categorias" },
      {
        key: "fornecedor",
        label: "Fornecedor principal",
        relation: "fornecedores",
      },
      {
        key: "unidade",
        label: "Unidade",
        choices: [
          ["UN", "Unidade"],
          ["M", "Metro"],
          ["KG", "Quilograma"],
          ["RL", "Rolo"],
          ["CX", "Caixa"],
        ],
        default: "UN",
      },
      {
        key: "estoque_minimo",
        label: "Estoque mínimo",
        decimal: true,
        default: "0",
      },
      {
        key: "preco",
        label: "Custo unitário (R$)",
        decimal: true,
        default: "0",
      },
      { key: "localizacao", label: "Localização", optional: true },
      {
        key: "especificacao",
        label: "Especificação técnica",
        multiline: true,
        optional: true,
      },
    ],
  },
  movimentacoes: {
    title: "Movimentações",
    singular: "Movimentação",
    icon: "⇄",
    description: "Entradas e saídas de materiais",
    fields: [
      { key: "material", label: "Material", relation: "materiais" },
      {
        key: "tipo",
        label: "Tipo",
        choices: [
          ["E", "Entrada"],
          ["S", "Saída"],
        ],
        default: "E",
      },
      { key: "quantidade", label: "Quantidade", decimal: true },
      { key: "referencia", label: "Origem / destino" },
      {
        key: "observacao",
        label: "Observação",
        multiline: true,
        optional: true,
      },
    ],
  },
  categorias: {
    title: "Categorias",
    singular: "Categoria",
    icon: "◈",
    description: "Organize os tipos de material",
    fields: [
      { key: "nome", label: "Nome" },
      { key: "descricao", label: "Descrição", multiline: true, optional: true },
    ],
  },
  fornecedores: {
    title: "Fornecedores",
    singular: "Fornecedor",
    icon: "▤",
    description: "Parceiros de abastecimento",
    fields: [
      { key: "nome", label: "Nome / razão social" },
      { key: "cnpj", label: "CNPJ (14 números)", numeric: true, maxLength: 14 },
      {
        key: "telefone",
        label: "Telefone",
        optional: true,
        keyboard: "phone-pad",
      },
      {
        key: "email",
        label: "E-mail",
        optional: true,
        keyboard: "email-address",
      },
    ],
  },
};
export const money = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
export const quantity = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const dateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

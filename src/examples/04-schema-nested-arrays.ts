import { SchemaBuilder, FString, FInt, FEmail, isSuccess, isFailure } from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";

console.log("=== SchemaBuilder — Nested & Arrays ===\n");

// Schema com nested objects e arrays
const orderSchema = {
  customer: {
    name: { type: FString },
    email: { type: FEmail },
  },
  items: { type: {
    name: { type: FString },
    quantity: { type: FInt },
  }, isArray: true },
  tags: { type: FString, isArray: true },
} satisfies ISchema;

type TOrderProps = InferProps<typeof orderSchema>;
type TOrderJson = InferJson<typeof orderSchema>;

const validator = SchemaBuilder.compile(orderSchema);

// Dados validos
const input: TOrderJson = {
  customer: {
    name: "Maria",
    email: "maria@test.com",
  },
  items: [
    { name: "Produto A", quantity: 2 },
    { name: "Produto B", quantity: 1 },
  ],
  tags: ["urgente", "premium"],
};
const result = validator.create(input);

if (isSuccess(result)) {
  const order: TOrderProps = result.value;
  console.log("Customer:", order.customer.name.getValue());
  console.log("Items:", order.items.length);
  console.log("Item 1:", order.items[0].name.getValue(), "x", order.items[0].quantity.getValue());
  console.log("Item 2:", order.items[1].name.getValue(), "x", order.items[1].quantity.getValue());
  console.log("Tags:", order.tags.map(t => t.getValue()));
}

// Erro em item do array
const invalid = validator.create({
  customer: { name: "Ana", email: "ana@test.com" },
  items: [
    { name: "OK", quantity: 1 },
    { name: "", quantity: 2 },  // nome vazio — erro
  ],
  tags: ["ok"],
});

if (isFailure(invalid)) {
  console.log("\nErro no array:");
  console.log("  campo:", invalid.error.field);
  console.log("  detalhe:", invalid.error.detail);
}

console.log("\nExemplo 04 concluido");

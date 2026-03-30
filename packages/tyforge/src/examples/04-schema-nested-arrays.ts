import { SchemaBuilder, FString, FInt, FEmail, isSuccess, isFailure } from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";

console.log("=== SchemaBuilder — Nested & Arrays ===\n");

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

console.log("\n=== isMap ===\n");

const configSchema = {
  settings: { type: FString, keyType: FString, isMap: true },
  metadata: { type: FInt, keyType: FString, isMap: true, required: false },
} satisfies ISchema;

type TConfigProps = InferProps<typeof configSchema>;
type TConfigJson = InferJson<typeof configSchema>;

const configValidator = SchemaBuilder.compile(configSchema);

const configInput: TConfigJson = {
  settings: {
    theme: "dark",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
  },
  metadata: {
    retries: 3,
    timeout: 5000,
  },
};

const configResult = configValidator.create(configInput);

if (isSuccess(configResult)) {
  const config: TConfigProps = configResult.value;
  console.log("Settings keys:", Object.keys(config.settings));
  console.log("theme:", config.settings["theme"].getValue());
  console.log("language:", config.settings["language"].getValue());
  if (config.metadata) {
    console.log("retries:", config.metadata["retries"].getValue());
    console.log("timeout:", config.metadata["timeout"].getValue());
  }
}

// Round-trip: toJSON → assign
if (isSuccess(configResult)) {
  const settings: Record<string, string> = {};
  for (const [key, value] of Object.entries(configResult.value.settings)) {
    settings[key] = value.getValue();
  }
  const metadata: Record<string, number> = {};
  if (configResult.value.metadata) {
    for (const [key, value] of Object.entries(configResult.value.metadata)) {
      metadata[key] = value.getValue();
    }
  }
  const json: TConfigJson = { settings, metadata };
  const roundTrip = configValidator.assign(json);
  if (isSuccess(roundTrip)) {
    console.log("Round-trip OK:", Object.keys(roundTrip.value.settings).length, "settings");
  }
}

// Erro em valor do map
const invalidConfig = configValidator.create({
  settings: {
    theme: "",  // string vazia — erro
  },
});

if (isFailure(invalidConfig)) {
  console.log("\nErro no map:");
  console.log("  campo:", invalidConfig.error.field);
  console.log("  detalhe:", invalidConfig.error.detail);
}

console.log("\nExemplo 04 concluido");

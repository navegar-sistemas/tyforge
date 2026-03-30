import { SchemaBuilder, FString, FEmail, FInt, FId, isSuccess, isFailure } from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge";

console.log("=== SchemaBuilder — Validacao ===\n");

// 1. Definir schema
const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
} satisfies ISchema;

type TUserProps = InferProps<typeof userSchema>;
type TUserJson = InferJson<typeof userSchema>;

// 2. Compilar (uma vez, reutilizar)
const validator = SchemaBuilder.compile(userSchema);

// 3. Validar dados validos
const input: TUserJson = {
  name: "Maria Silva",
  email: "maria@test.com",
  age: 28,
};
const result = validator.create(input);

if (isSuccess(result)) {
  const user: TUserProps = result.value;
  console.log("name:", user.name.getValue());
  console.log("email:", user.email.getValue());
  console.log("age:", user.age?.getValue());
  console.log("id:", user.id); // undefined (nao foi passado)
}

// 4. Validar dados invalidos
const invalid = validator.create({
  name: "",        // FString min 1 char
  email: "bad",    // FEmail precisa de @
});

if (isFailure(invalid)) {
  console.log("\nErro de validacao:");
  console.log("  campo:", invalid.error.field);
  console.log("  detalhe:", invalid.error.detail);
  console.log("  status:", invalid.error.status);
}

// 5. Reutilizar o validator
const another = validator.create({ name: "Joao", email: "joao@test.com" });
if (isSuccess(another)) {
  console.log("\nSegunda validacao:", another.value.name.getValue());
}

console.log("\nExemplo 03 concluido");

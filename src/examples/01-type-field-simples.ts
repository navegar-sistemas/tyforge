import { FString, FEmail, FInt, FBoolean, FId, isSuccess, isFailure } from "@tyforge/index";

console.log("=== TypeFields Basicos ===\n");

// FString
const name = FString.create("Maria Silva");
if (isSuccess(name)) {
  console.log("FString:", name.value.getValue()); // "Maria Silva"
  console.log("toJSON:", name.value.toJSON());     // "Maria Silva"
}

// FEmail
const email = FEmail.create("maria@test.com");
if (isSuccess(email)) {
  console.log("FEmail:", email.value.getValue());
  console.log("formatted:", email.value.formatted()); // lowercase
}

// FEmail invalido
const badEmail = FEmail.create("invalido");
if (isFailure(badEmail)) {
  console.log("Erro:", badEmail.error.field, "-", badEmail.error.detail);
}

// FInt
const age = FInt.create(28);
if (isSuccess(age)) {
  console.log("FInt:", age.value.getValue());
}

// FBoolean (accepts only boolean)
const active = FBoolean.create(true);
const inactive = FBoolean.create(false);
if (isSuccess(active)) console.log("FBoolean (true):", active.value.getValue());
if (isSuccess(inactive)) console.log("FBoolean (false):", inactive.value.getValue());

// FId
const id = FId.generate();
console.log("FId.generate():", id.getValue());

const idFromString = FId.create("019d0863-5d45-7246-b6d0-de5098bfd12e");
if (isSuccess(idFromString)) console.log("FId.create():", idFromString.value.getValue());

// createOrThrow
const name2 = FString.createOrThrow("Joao");
console.log("createOrThrow:", name2.getValue());

console.log("\nExemplo 01 concluido");

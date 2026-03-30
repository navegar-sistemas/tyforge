import {
  Exceptions, ExceptionValidation, ExceptionBusiness,
  ExceptionNotFound, ExceptionAuth,
  ExceptionOptimisticLock,
} from "@tyforge/index";

console.log("=== Exceptions (RFC 7807) ===\n");

// ExceptionValidation
const validation = ExceptionValidation.create("email", "Email inválido");
console.log("Validation:", validation.toJSON());
// { type, title, detail, status, code, field: "email", retriable }

// ExceptionBusiness — factory methods
const duplicate = ExceptionBusiness.duplicateEntry("email");
console.log("\nBusiness (duplicate):", duplicate.toJSON());

const notAllowed = ExceptionBusiness.operationNotAllowed();
console.log("Business (not allowed):", notAllowed.status);

const invalidRule = ExceptionBusiness.invalidBusinessRule("saldo insuficiente");
console.log("Business (rule):", invalidRule.detail);

const notFound = ExceptionBusiness.notFound("Usuário");
console.log("Business (not found):", notFound.status);

// ExceptionNotFound
console.log("\nExceptionNotFound disponível:", ExceptionNotFound.name);

// ExceptionAuth
console.log("ExceptionAuth disponível:", ExceptionAuth.name);

// ExceptionOptimisticLock
const lock = ExceptionOptimisticLock.create("Order", "123");
console.log("\nOptimisticLock:", lock.toJSON());
console.log("Status:", lock.status);

// Todas herdam de Exceptions
console.log("\nHerança:");
console.log("validation instanceof Exceptions:", validation instanceof Exceptions);
console.log("duplicate instanceof Exceptions:", duplicate instanceof Exceptions);
console.log("lock instanceof Exceptions:", lock instanceof Exceptions);

console.log("\n✅ Exemplo 09 concluído");

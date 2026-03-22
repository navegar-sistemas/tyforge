import { FAppStatus, FHttpStatus, OHttpStatus, isSuccess, isFailure } from "@tyforge/index";

console.log("=== TypeField Enum ===\n");

// FAppStatus — enum via const object
const status = FAppStatus.create("active");
if (isSuccess(status)) {
  console.log("FAppStatus:", status.value.getValue());     // "active"
  console.log("isActive:", status.value.isActive());       // true
  console.log("toJSON:", status.value.toJSON());           // "active"
}

// Valor invalido — validateRaw aceita unknown
const invalidValue = FAppStatus.validateRaw("deleted", "status");
if (isFailure(invalidValue)) {
  console.log("Erro enum:", invalidValue.error.detail);
}

// FHttpStatus
const httpOk = FHttpStatus.create(200);
if (isSuccess(httpOk)) {
  console.log("FHttpStatus:", httpOk.value.getValue()); // 200
}

// Acessar valores do OHttpStatus (const object exportado)
console.log("OHttpStatus.OK:", OHttpStatus.OK);               // 200
console.log("OHttpStatus.NOT_FOUND:", OHttpStatus.NOT_FOUND);  // 404

console.log("\nExemplo 02 concluido");

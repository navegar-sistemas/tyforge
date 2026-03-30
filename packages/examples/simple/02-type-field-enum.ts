import { FAppStatus, FHttpStatus, OHttpStatus, isSuccess, isFailure } from "tyforge";

console.log("=== TypeField Enum ===\n");

// FAppStatus — enum via const object
const status = FAppStatus.create("active");
if (isSuccess(status)) {
  console.log("FAppStatus:", status.value.getValue());     // "active"
  console.log("isActive:", status.value.isActive());       // true
  console.log("toJSON:", status.value.toJSON());           // "active"
}

// Invalid value — create<unknown> accepts unknown
const invalidValue = FAppStatus.create<unknown>("deleted", "status");
if (isFailure(invalidValue)) {
  console.log("Erro enum:", invalidValue.error.detail);
}

// FHttpStatus
const httpOk = FHttpStatus.create(OHttpStatus.OK);
if (isSuccess(httpOk)) {
  console.log("FHttpStatus:", httpOk.value.getValue());
}

// Acessar valores do OHttpStatus (const object exportado)
console.log("OHttpStatus.OK:", OHttpStatus.OK);
console.log("OHttpStatus.NOT_FOUND:", OHttpStatus.NOT_FOUND);

console.log("\nExemplo 02 concluido");

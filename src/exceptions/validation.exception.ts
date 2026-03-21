import { Exceptions } from "./base.exceptions";

export class ExceptionValidation extends Exceptions {
  override readonly typeInference = "ExceptionValidation" as const;

  private constructor(field: string, detail: string) {
    super({
      type: "ExceptionValidation",
      title: "Erro de Validação",
      detail,
      status: 400, // BAD_REQUEST
      instance: "",
      uri: "",
      field,
      code: "VALIDATION_ERROR",
    });
  }

  static create(
    field = "UNKNOWN_FIELD",
    detail = "Valor inválido",
  ): ExceptionValidation {
    return new ExceptionValidation(field, detail);
  }
}

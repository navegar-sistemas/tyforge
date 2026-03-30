import { Exceptions } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionValidation extends Exceptions {
  override readonly typeInference = "ExceptionValidation" as const;

  private constructor(field: string, detail: string) {
    super({
      type: "ExceptionValidation",
      title: "Erro de Validação",
      detail,
      status: OHttpStatus.BAD_REQUEST,
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

import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

export class ExceptionIntInvalid extends Exceptions {
  readonly typeInference = "ExceptionIntInvalid" as const;

  private constructor(field: string) {
    super({
      type: "ExceptionIntInvalid",
      title: "Inteiro inválido.",
      status: OHttpStatus.BAD_REQUEST,
      detail: `O valor inteiro fornecido para o campo '${field}' é inválido.`,
      instance: "",
      uri: "",
      field: field,
      code: "INT_INVALID",
    });
  }

  static create(field = ""): ExceptionIntInvalid {
    return new ExceptionIntInvalid(field);
  }
}

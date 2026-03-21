import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const STRING_CODES = {
  INVALID: "STRING_INVALID",
  UNDEFINED: "STRING_UNDEFINED",
} as const;

export class ExceptionString extends Exceptions {
  readonly typeInference = "ExceptionString" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionString",
      title: "Erro de validação de texto.",
      status: OHttpStatus.BAD_REQUEST,
      detail,
      field: "",
      instance: "",
      uri: "",
      code,
    });
  }

  static invalid(field = ""): ExceptionString {
    return new ExceptionString(
      `O texto fornecido para o campo '${field}' é inválido.`,
      STRING_CODES.INVALID,
    );
  }

  static undefined(field = ""): ExceptionString {
    return new ExceptionString(
      `O texto para o campo '${field}' não foi fornecido.`,
      STRING_CODES.UNDEFINED,
    );
  }
}

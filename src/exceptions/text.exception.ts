import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const TEXT_CODES = {
  INVALID: "TEXT_INVALID",
  UNDEFINED: "TEXT_UNDEFINED",
} as const;

export class ExceptionText extends Exceptions {
  readonly typeInference = "ExceptionText" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionText",
      title: "Erro de validação de texto.",
      status: OHttpStatus.BAD_REQUEST,
      detail,
      field: "",
      instance: "",
      uri: "",
      code,
    });
  }

  static invalid(field = ""): ExceptionText {
    return new ExceptionText(
      `O texto fornecido para o campo '${field}' é inválido.`,
      TEXT_CODES.INVALID,
    );
  }

  static undefined(field = ""): ExceptionText {
    return new ExceptionText(
      `O texto para o campo '${field}' não foi fornecido.`,
      TEXT_CODES.UNDEFINED,
    );
  }
}

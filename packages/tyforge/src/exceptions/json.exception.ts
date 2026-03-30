import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const JSON_CODES = {
  INVALID: "JSON_INVALID",
  UNDEFINED: "JSON_UNDEFINED",
} as const;

export class ExceptionJson extends Exceptions {
  readonly typeInference = "ExceptionJson" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionJson",
      title: "Erro de validação de JSON.",
      status: OHttpStatus.BAD_REQUEST,
      detail,
      field: "",
      instance: "",
      uri: "",
      code,
    });
  }

  static invalid(field = ""): ExceptionJson {
    return new ExceptionJson(
      `O JSON fornecido para o campo '${field}' é inválido.`,
      JSON_CODES.INVALID,
    );
  }

  static undefined(field = ""): ExceptionJson {
    return new ExceptionJson(
      `O JSON para o campo '${field}' não foi fornecido.`,
      JSON_CODES.UNDEFINED,
    );
  }
}

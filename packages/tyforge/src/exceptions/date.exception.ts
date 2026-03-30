import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const DATE_CODES = {
  INVALID: "DATE_INVALID",
  UNDEFINED: "DATE_UNDEFINED",
} as const;

export class ExceptionDate extends Exceptions {
  readonly typeInference = "ExceptionDate" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionDate",
      title: "Erro de validação de data.",
      status: OHttpStatus.BAD_REQUEST,
      detail,
      field: "",
      instance: "",
      uri: "",
      code,
    });
  }

  static invalid(field = ""): ExceptionDate {
    return new ExceptionDate(
      `A data fornecida para o campo '${field}' é inválida.`,
      DATE_CODES.INVALID,
    );
  }

  static undefined(field = ""): ExceptionDate {
    return new ExceptionDate(
      `A data para o campo '${field}' não foi fornecida.`,
      DATE_CODES.UNDEFINED,
    );
  }
}

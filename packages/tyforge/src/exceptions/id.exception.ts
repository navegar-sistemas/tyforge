import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const ID_CODES = {
  INVALID: "ID_INVALID",
  UNDEFINED: "ID_UNDEFINED",
} as const;

export class ExceptionId extends Exceptions {
  readonly typeInference = "ExceptionId" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionId",
      title: "Erro de validação de ID.",
      status: OHttpStatus.BAD_REQUEST,
      detail,
      field: "",
      instance: "",
      uri: "",
      code,
    });
  }

  static invalid(field = ""): ExceptionId {
    return new ExceptionId(
      `O ID fornecido para o campo '${field}' é inválido.`,
      ID_CODES.INVALID,
    );
  }

  static undefined(field = ""): ExceptionId {
    return new ExceptionId(
      `O ID para o campo '${field}' não foi fornecido.`,
      ID_CODES.UNDEFINED,
    );
  }
}

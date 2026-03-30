import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

const NOT_FOUND_CODES = {
  GENERIC: "NOT_FOUND_GENERIC",
  REGISTRO: "NOT_FOUND_REGISTRO",
  EXTERNAL_SERVICE: "NOT_FOUND_EXTERNAL_SERVICE",
} as const;

export class ExceptionNotFound extends Exceptions {
  readonly typeInference = "ExceptionNotFound" as const;

  private constructor(detail: string, code: string) {
    super({
      type: "ExceptionNotFound",
      status: OHttpStatus.NOT_FOUND,
      title: "Recurso não encontrado.",
      detail,
      instance: "",
      uri: "",
      field: "",
      code,
    });
  }
  static generic(): ExceptionNotFound {
    return new ExceptionNotFound(
      "O recurso solicitado não foi encontrado.",
      NOT_FOUND_CODES.GENERIC,
    );
  }

  static registro(): ExceptionNotFound {
    return new ExceptionNotFound(
      "Nenhum registro encontrado.",
      NOT_FOUND_CODES.REGISTRO,
    );
  }

  static externalService(): ExceptionNotFound {
    return new ExceptionNotFound(
      "Falha ao acessar recurso externo, tente novamente mais tarde.",
      NOT_FOUND_CODES.EXTERNAL_SERVICE,
    );
  }
}

import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

interface ExceptionLog {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export class ExceptionUnexpected extends Exceptions {
  readonly log?: ExceptionLog;

  private constructor(log?: ExceptionLog, detail?: string) {
    super({
      type: "ExceptionUnexpected",
      title: "Ocorreu um erro inesperado.",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      detail: detail || "Um erro inesperado ocorreu durante a operação.",
      instance: "",
      uri: "",
      field: "",
      code: "UNEXPECTED_ERROR",
    });
    this.log = log;
  }
  static create(log?: ExceptionLog): ExceptionUnexpected {
    return new ExceptionUnexpected(log);
  }
  static externalService(log?: ExceptionLog): ExceptionUnexpected {
    return new ExceptionUnexpected(log, "Erro ao acessar serviço externo");
  }
}

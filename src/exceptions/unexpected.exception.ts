import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

interface IExceptionLog {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export class ExceptionUnexpected extends Exceptions {
  readonly log?: IExceptionLog;

  private constructor(log?: IExceptionLog, detail?: string) {
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
  static create(log?: IExceptionLog): ExceptionUnexpected {
    return new ExceptionUnexpected(log);
  }
  static externalService(log?: IExceptionLog): ExceptionUnexpected {
    return new ExceptionUnexpected(log, "Erro ao acessar serviço externo");
  }
}

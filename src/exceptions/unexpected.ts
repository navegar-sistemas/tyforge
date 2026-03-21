import { THttpStatus } from "@tyforge/type-fields";
import { Exceptions } from "./base.exceptions";

interface ExceptionLog {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export default class ExceptionUnexpected extends Exceptions {
  static readonly status: THttpStatus = 500; // INTERNAL_SERVER_ERROR
  override readonly typeInference = "ExceptionUnexpected" as const;
  readonly log?: ExceptionLog;

  private constructor(log?: ExceptionLog, detail?: string) {
    super({
      type: "ExceptionUnexpected",
      title: "Ocorreu um erro inesperado.",
      status: ExceptionUnexpected.status,
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

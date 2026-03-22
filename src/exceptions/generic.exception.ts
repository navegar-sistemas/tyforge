import { Exceptions } from "./base.exceptions";
import { THttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionGeneric extends Exceptions {
  readonly typeInference = "ExceptionGeneric" as const;
  readonly data: Record<string, unknown>;

  private constructor(status: THttpStatus, detail: string, data: Record<string, unknown>) {
    super({
      type: "ExceptionGeneric",
      title: "Erro genérico.",
      status: status,
      detail: detail,
      instance: "",
      uri: "",
      field: "",
      code: "GENERIC_ERROR",
    });
    this.data = data;
  }

  static create(
    status: THttpStatus,
    data: Record<string, unknown>,
    detail = "Ocorreu um erro durante a operação.",
  ): ExceptionGeneric {
    return new ExceptionGeneric(status, detail, data);
  }
}

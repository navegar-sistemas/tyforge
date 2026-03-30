import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

export class ExceptionInterface extends Exceptions {
  static readonly status = OHttpStatus.INTERNAL_SERVER_ERROR;
  override readonly typeInference = "ExceptionInterface" as const;
  readonly log?: Record<string, unknown>;

  private constructor(field: string, log?: Record<string, unknown>) {
    super({
      type: "ExceptionInterface",
      title: "Ocorreu um erro inesperado.",
      status: ExceptionInterface.status,
      detail:
        "Não foi possível validar o tipo de instância para a interface de saída.",
      instance: "",
      uri: "",
      field: field,
      code: "INTERFACE_ERROR",
    });
    this.log = log;
  }
  static create(field = "", log?: Record<string, unknown>): ExceptionInterface {
    return new ExceptionInterface(field, log);
  }
}

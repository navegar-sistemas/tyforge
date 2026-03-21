import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

export class ExceptionBooleanInvalid extends Exceptions {
  readonly typeInference = "ExceptionBooleanInvalid" as const;
  private constructor(field: string) {
    super({
      type: "ExceptionBooleanInvalid",
      title: "Booleano inválido.",
      status: OHttpStatus.BAD_REQUEST,
      detail: `O valor booleano fornecido para o campo '${field}' é inválido.`,
      instance: "",
      uri: "",
      field: field,
      code: "BOOLEAN_INVALID",
    });
  }

  static create(field = ""): ExceptionBooleanInvalid {
    return new ExceptionBooleanInvalid(field);
  }
}

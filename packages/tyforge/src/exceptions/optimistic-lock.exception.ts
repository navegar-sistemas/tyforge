import { Exceptions } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionOptimisticLock extends Exceptions {
  private constructor(detail: string) {
    super({
      type: "concurrency/optimistic-lock",
      title: "Conflito de Concorrência",
      detail,
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "OPTIMISTIC_LOCK",
      retriable: true,
    });
  }

  static create(entity: string, id?: string): ExceptionOptimisticLock {
    const detail = id
      ? `A entidade ${entity} (${id}) foi modificada por outro processo`
      : `A entidade ${entity} foi modificada por outro processo`;
    return new ExceptionOptimisticLock(detail);
  }
}

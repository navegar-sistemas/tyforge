import { Exceptions, ExceptionDetails } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionBusiness extends Exceptions {
  private constructor(details: ExceptionDetails) {
    super(details);
  }

  static invalidBusinessRule(debug: string): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/invalid-rule",
      title: "Regra de Negócio Inválida",
      detail: `Uma validação de regra de negócio falhou, ${debug}`,
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "BUSINESS_INVALID_RULE",
    });
  }

  static operationNotAllowed(): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/operation-not-allowed",
      title: "Operação Não Permitida",
      detail: "A operação solicitada não é permitida",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "BUSINESS_OPERATION_NOT_ALLOWED",
    });
  }

  static insufficientBalance(): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/insufficient-balance",
      title: "Saldo Insuficiente",
      detail: "Saldo insuficiente para esta operação",
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "BUSINESS_INSUFFICIENT_BALANCE",
    });
  }

  static limitExceeded(): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/limit-exceeded",
      title: "Limite Excedido",
      detail: "Um limite foi excedido",
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "BUSINESS_LIMIT_EXCEEDED",
    });
  }

  static duplicateEntry(field?: string): ExceptionBusiness {
    const detail = field
      ? `Já existe um registro com ${field} informado`
      : "O recurso já existe";

    return new ExceptionBusiness({
      type: "business/duplicate-entry",
      title: "Entrada Duplicada",
      detail,
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "BUSINESS_DUPLICATE_ENTRY",
      field,
    });
  }

  static invalidState(): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/invalid-state",
      title: "Estado Inválido",
      detail: "O recurso está em um estado inválido para esta operação",
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "BUSINESS_INVALID_STATE",
    });
  }

  static notFound(resource?: string): ExceptionBusiness {
    const detail = resource
      ? `${resource} não encontrado(a)`
      : "Recurso solicitado não foi encontrado";

    return new ExceptionBusiness({
      type: "business/not-found",
      title: "Não Encontrado",
      detail,
      status: OHttpStatus.NOT_FOUND,
      instance: "",
      uri: "",
      code: "BUSINESS_NOT_FOUND",
    });
  }

  static notImplemented(): ExceptionBusiness {
    return new ExceptionBusiness({
      type: "business/not-implemented",
      title: "Não Implementado",
      detail: "Funcionalidade não implementada",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "BUSINESS_NOT_IMPLEMENTED",
    });
  }
}

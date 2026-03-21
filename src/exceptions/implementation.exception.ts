import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { Exceptions } from "./base.exceptions";

export default class ExceptionImplementation extends Exceptions {
  static readonly status = OHttpStatus.INTERNAL_SERVER_ERROR;
  override readonly typeInference = "ExceptionImplementation" as const;
  readonly log?: Record<string, unknown>;

  private constructor(log?: Record<string, unknown>, detail?: string) {
    super({
      type: "ExceptionImplementation",
      title: "Erro interno do sistema.",
      status: ExceptionImplementation.status,
      detail: detail || "Ocorreu um problema interno durante o processamento.",
      instance: "",
      uri: "",
      field: "",
      code: "IMPLEMENTATION_ERROR",
    });
    this.log = log;
  }

  static create(log?: Record<string, unknown>): ExceptionImplementation {
    return new ExceptionImplementation(log);
  }

  static missingMethod(
    methodName: string,
    className: string,
  ): ExceptionImplementation {
    return new ExceptionImplementation(
      { methodName, className },
      `Método '${methodName}' não implementado em '${className}'`,
    );
  }

  static invalidReturnType(
    expectedType: string,
    actualType: string,
  ): ExceptionImplementation {
    return new ExceptionImplementation(
      { expectedType, actualType },
      `Tipo de retorno inválido: esperado '${expectedType}', recebido '${actualType}'`,
    );
  }

  static missingDependency(dependencyName: string): ExceptionImplementation {
    return new ExceptionImplementation(
      { dependencyName },
      `Dependência '${dependencyName}' não encontrada`,
    );
  }

  static configurationError(): ExceptionImplementation {
    return new ExceptionImplementation(
      undefined,
      "Configuração não definida corretamente",
    );
  }
}

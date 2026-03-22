import { Exceptions, IExceptionDetails } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionDb extends Exceptions {
  private constructor(details: IExceptionDetails) {
    super(details);
  }

  static recordNotFound(): ExceptionDb {
    return new ExceptionDb({
      type: "database/record-not-found",
      title: "Registro não encontrado",
      detail: "O registro solicitado não foi encontrado no banco de dados.",
      status: OHttpStatus.NOT_FOUND,
      instance: "",
      uri: "",
      code: "DB_RECORD_NOT_FOUND",
    });
  }

  static duplicateEntry(): ExceptionDb {
    return new ExceptionDb({
      type: "database/duplicate-entry",
      title: "Registro duplicado",
      detail: "Já existe um registro com os mesmos dados.",
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "DB_DUPLICATE_ENTRY",
    });
  }

  static invalidData(): ExceptionDb {
    return new ExceptionDb({
      type: "database/invalid-data",
      title: "Dados inválidos",
      detail: "Os dados fornecidos estão em formato inválido para persistência.",
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "DB_INVALID_DATA",
    });
  }

  static unexpectedError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/unexpected-error",
      title: "Erro de banco de dados",
      detail: "Ocorreu um erro inesperado no banco de dados.",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "DB_UNEXPECTED_ERROR",
    });
  }

  static connectionError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/connection-error",
      title: "Erro de conexão",
      detail: "Não foi possível conectar ao banco de dados.",
      status: OHttpStatus.SERVICE_UNAVAILABLE,
      instance: "",
      uri: "",
      code: "DB_CONNECTION_ERROR",
    });
  }

  static transactionError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/transaction-error",
      title: "Erro de transação",
      detail: "A transação do banco de dados falhou.",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "DB_TRANSACTION_ERROR",
    });
  }

  static queryError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/query-error",
      title: "Erro de consulta",
      detail: "Ocorreu um erro durante a execução da consulta.",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "DB_QUERY_ERROR",
    });
  }

  static foreignKeyConstraintViolation(field?: string): ExceptionDb {
    const detail = field
      ? `O ${field} informado não existe no sistema`
      : "A referência informada não existe ou é inválida";

    return new ExceptionDb({
      type: "database/foreign-key-violation",
      title: "Referência Inválida",
      detail,
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "DB_FOREIGN_KEY_VIOLATION",
      field,
    });
  }
}

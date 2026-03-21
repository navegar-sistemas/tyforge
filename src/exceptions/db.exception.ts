import { Exceptions, ExceptionDetails } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionDb extends Exceptions {
  private constructor(details: ExceptionDetails) {
    super(details);
  }

  static recordNotFound(): ExceptionDb {
    return new ExceptionDb({
      type: "database/record-not-found",
      title: "Record Not Found",
      detail: `entity not found`,
      status: OHttpStatus.NOT_FOUND,
      instance: "",
      uri: "",
      code: "DB_RECORD_NOT_FOUND",
    });
  }

  static duplicateEntry(): ExceptionDb {
    return new ExceptionDb({
      type: "database/duplicate-entry",
      title: "Duplicate Entry",
      detail: `entity already exists`,
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "DB_DUPLICATE_ENTRY",
    });
  }

  static invalidData(): ExceptionDb {
    return new ExceptionDb({
      type: "database/invalid-data",
      title: "Invalid Data",
      detail: "Invalid data format",
      status: OHttpStatus.UNPROCESSABLE_ENTITY,
      instance: "",
      uri: "",
      code: "DB_INVALID_DATA",
    });
  }

  static unexpectedError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/unexpected-error",
      title: "Database Error",
      detail: `Database error`,
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "DB_UNEXPECTED_ERROR",
    });
  }

  static connectionError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/connection-error",
      title: "Connection Error",
      detail: "Database connection error",
      status: OHttpStatus.SERVICE_UNAVAILABLE,
      instance: "",
      uri: "",
      code: "DB_CONNECTION_ERROR",
    });
  }

  static transactionError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/transaction-error",
      title: "Transaction Error",
      detail: "Transaction failed",
      status: OHttpStatus.INTERNAL_SERVER_ERROR,
      instance: "",
      uri: "",
      code: "DB_TRANSACTION_ERROR",
    });
  }

  static queryError(): ExceptionDb {
    return new ExceptionDb({
      type: "database/query-error",
      title: "Query Error",
      detail: `Query error in operation`,
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

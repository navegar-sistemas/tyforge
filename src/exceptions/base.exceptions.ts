import { THttpStatus } from "@tyforge/type-fields";

export interface ExceptionDetails {
  type: string;
  title: string;
  detail: string;
  status: THttpStatus;
  instance: string;
  uri: string;
  field?: string;
  code: string;
  additionalFields?: Record<string, unknown>;
  retriable?: boolean;
}

/**
 * Classe base para todas as exceções do domínio.
 */
export abstract class Exceptions extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly status: THttpStatus;
  public readonly instance: string;
  public readonly uri: string;
  public readonly field?: string;
  public readonly code: string;
  private readonly _stack: string | undefined;
  public readonly typeInference: string = "Exceptions";
  public readonly additionalFields?: Record<string, unknown>;
  public readonly retriable: boolean;

  constructor({
    type,
    title,
    detail,
    status,
    instance,
    uri,
    field,
    code,
    additionalFields,
    retriable = true,
  }: ExceptionDetails) {
    super(detail);
    this.name = this.constructor.name;
    this.type = type;
    this.title = title;
    this.detail = detail;
    this.status = status;
    this.instance = instance;
    this.uri = uri;
    this.field = field;
    this.code = code;
    this.additionalFields = additionalFields;
    this.retriable = retriable;

    // Stack customizada com base no título da exceção
    this._stack = new Error(title).stack;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  override get stack(): string | undefined {
    return this._stack;
  }

  toJson(): Record<string, unknown> {
    return {
      type: this.type,
      title: this.title,
      detail: this.detail,
      status: this.status,
      instance: this.instance,
      uri: this.uri,
      field: this.field,
      code: this.code,
      additionalFields: this.additionalFields,
      retriable: this.retriable,
    };
  }
}

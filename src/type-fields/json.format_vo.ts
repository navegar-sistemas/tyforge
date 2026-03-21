import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TJson = Record<string, unknown>;
export type TJsonFormatted = string;

export class FJson extends TypeField<TJson, TJsonFormatted> {
  override readonly typeInference = "FJson";

  override readonly config: ITypeFieldConfig<TJson> = {
    jsonSchemaType: "object",
    serializeAsString: false,
  };

  private constructor(value: TJson, fieldPath: string) {
    super(value, fieldPath);
  }

  private static isPlainObject(v: unknown): v is TJson {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<TJson, ExceptionValidation> {
    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        if (FJson.isPlainObject(parsed)) {
          return ok(parsed);
        }
        return err(ExceptionValidation.create(fieldPath, "Deve ser um objeto JSON válido"));
      } catch {
        return err(ExceptionValidation.create(fieldPath, "Deve ser um objeto JSON válido"));
      }
    }
    if (FJson.isPlainObject(value)) {
      return ok(value);
    }
    return err(ExceptionValidation.create(fieldPath, "Deve ser um objeto JSON válido"));
  }

  static create(
    raw: unknown,
    fieldPath = "Json",
  ): Result<FJson, ExceptionValidation> {
    const validation = FJson.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FJson(validation.value, fieldPath));
  }

  static createOrThrow(raw: unknown, fieldPath = "Json"): FJson {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static createNew(
    data: TJson = {},
    fieldPath = "Json",
  ): Result<FJson, ExceptionValidation> {
    return this.create(data, fieldPath);
  }

  override validate(
    value: TJson,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const parsed = FJson.validateRaw(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    return OK_TRUE;
  }

  serialize(): string {
    return JSON.stringify(this._value);
  }

  getAsString(): string {
    return JSON.stringify(this._value);
  }

  get(key: string): unknown {
    return this._value[key];
  }

  has(key: string): boolean {
    return key in this._value;
  }

  keys(): string[] {
    return Object.keys(this._value);
  }

  isEmpty(): boolean {
    return Object.keys(this._value).length === 0;
  }

  override getDescription(): string {
    return `Objeto JSON com ${Object.keys(this._value).length} propriedades`;
  }

  override getShortDescription(): string {
    return `JSON(${Object.keys(this._value).length} props)`;
  }

  override formatted(): string {
    return JSON.stringify(this._value, null, 2);
  }
}

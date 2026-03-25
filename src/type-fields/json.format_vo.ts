import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

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

  static create<T = TJson>(raw: T, fieldPath = "Json"): Result<FJson, ExceptionValidation> {
    if (!TypeGuard.isRecord(raw)) return err(ExceptionValidation.create(fieldPath, "Expected object"));
    const instance = new FJson(raw, fieldPath);
    const validation = instance.validate(raw, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TJson, fieldPath = "Json"): FJson {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TJson>(value: T, fieldPath = "Json"): Result<FJson, ExceptionValidation> {
    if (!TypeGuard.isRecord(value)) return err(ExceptionValidation.create(fieldPath, "Expected object"));
    const instance = new FJson(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createNew(
    data: TJson = {},
    fieldPath = "Json",
  ): Result<FJson, ExceptionValidation> {
    return this.create(data, fieldPath);
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
    return Object.prototype.hasOwnProperty.call(this._value, key);
  }

  keys(): string[] {
    return Object.keys(this._value);
  }

  isEmpty(): boolean {
    return Object.keys(this._value).length === 0;
  }

  override toString(): string {
    return JSON.stringify(this.getValue());
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

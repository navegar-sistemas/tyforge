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

  static validateType(value: unknown, fieldPath: string): Result<TJson, ExceptionValidation> {
    if (!TypeGuard.isRecord(value)) return err(ExceptionValidation.create(fieldPath, "Expected object"));
    return ok(value);
  }

  static create<T = TJson>(raw: T, fieldPath = "Json"): Result<FJson, ExceptionValidation> {
    const typed = FJson.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FJson(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TJson, fieldPath = "Json"): FJson {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TJson>(value: T, fieldPath = "Json"): Result<FJson, ExceptionValidation> {
    const typed = FJson.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FJson(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
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

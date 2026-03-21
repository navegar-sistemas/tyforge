import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TJson = Record<string, unknown>;

export class FJson extends TypeField<TJson> {
  override readonly typeInference = "FJson";

  override readonly config: ITypeFieldConfig<TJson> = {
    jsonSchemaType: "object",
    serializeAsString: false,
  };

  private constructor(value: TJson, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: unknown,
    fieldPath = "Json",
  ): Result<FJson, ExceptionValidation> {
    const parseJson = (value: unknown): TJson => {
      if (typeof value === "string") {
        try {
          const parsed: unknown = JSON.parse(value);
          if (typeof parsed === "object" && parsed !== null) {
            return parsed as TJson;
          }
          return {};
        } catch {
          return {};
        }
      }
      if (typeof value === "object" && value !== null) {
        return value as TJson;
      }
      return {};
    };

    const parsedValue = parseJson(raw);
    const inst = new FJson(parsedValue, fieldPath);
    const validation = inst.validate(parsedValue, fieldPath);

    if (isFailure(validation)) {
      return err(validation.error);
    }
    return ok(inst);
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
    const baseValidation = super.validate(value, fieldPath);
    if (isFailure(baseValidation)) return baseValidation;

    if (!value || typeof value !== "object") {
      return err(
        ExceptionValidation.create(fieldPath, "Deve ser um objeto JSON válido"),
      );
    }

    return ok(true);
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

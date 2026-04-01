import {
  TypeField,
  TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TIdSeq = number;
export type TIdSeqFormatted = string;

export class FIdSeq extends TypeField<TIdSeq, TIdSeqFormatted> {
  override readonly typeInference = "FIdSeq";

  override readonly config: ITypeFieldConfig<TIdSeq> = {
    jsonSchemaType: "number",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  private constructor(value: TIdSeq, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TIdSeq,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Sequential ID must be an integer",
        ),
      );
    }
    return OK_TRUE;
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TIdSeq, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static create<T = TIdSeq>(
    raw: T,
    fieldPath = "IdSeq",
  ): Result<FIdSeq, ExceptionValidation> {
    const typed = FIdSeq.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FIdSeq(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TIdSeq, fieldPath = "IdSeq"): FIdSeq {
    const result = FIdSeq.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TIdSeq>(
    value: T,
    fieldPath = "IdSeq",
  ): Result<FIdSeq, ExceptionValidation> {
    const typed = FIdSeq.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FIdSeq(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TIdSeqFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Sequential integer identifier" +
      " for database auto-increment primary keys."
    );
  }

  override getShortDescription(): string {
    return "Sequential ID";
  }
}

import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { Result } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { v7 as uuidv7 } from "uuid";

export type TIdentifier = string;
export type TIdentifierFormatted = string;

// Abstract base for all identifier TypeFields.
// Does NOT impose any format — subclasses define their own config (min/max length)
// and override validateRules for format-specific validation (UUID, alphanumeric, hex, etc).

export abstract class FIdentifier extends TypeField<TIdentifier, TIdentifierFormatted> {
  override readonly typeInference: string = "FIdentifier";

  protected constructor(value: TIdentifier, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TIdentifier, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static generateId(): string {
    return uuidv7();
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TIdentifierFormatted {
    return String(this.getValue());
  }

  abstract override getDescription(): string;
  abstract override getShortDescription(): string;
}

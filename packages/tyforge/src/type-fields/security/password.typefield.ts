import {
  TypeField,
  TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPassword = string;
export type TPasswordFormatted = string;

export interface IPasswordStrength {
  readonly length: boolean;
  readonly uppercase: boolean;
  readonly lowercase: boolean;
  readonly digit: boolean;
  readonly special: boolean;
}

export class FPassword extends TypeField<TPassword, TPasswordFormatted> {
  override readonly typeInference = "FPassword";

  override readonly config: ITypeFieldConfig<TPassword> = {
    jsonSchemaType: "string",
    minLength: 8,
    maxLength: 128,
    serializeAsString: false,
  };

  private static readonly MIN_LENGTH = 8;

  // Password complexity is enforced on ASCII
  // characters only. Unicode characters
  // are accepted in the password value but do not count toward
  // complexity requirements. This follows the NIST SP 800-63B
  // recommendation of accepting all Unicode while checking
  // complexity against the ASCII subset.
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly DIGIT_REGEX = /[0-9]/;
  private static readonly SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  private static readonly SEQ_ASC = "0123456789";
  private static readonly SEQ_DESC = "9876543210";

  private static readonly KEYBOARD_PATTERNS = [
    "qwerty",
    "qwertz",
    "azerty",
    "asdfgh",
    "zxcvbn",
    "!@#$%^",
    "1qaz2wsx",
    "qazwsx",
  ];

  private constructor(value: TPassword, fieldPath: string) {
    super(value, fieldPath);
  }

  static getStrength(value: string): IPasswordStrength {
    return {
      length: value.length >= FPassword.MIN_LENGTH,
      uppercase: FPassword.UPPERCASE_REGEX.test(value),
      lowercase: FPassword.LOWERCASE_REGEX.test(value),
      digit: FPassword.DIGIT_REGEX.test(value),
      special: FPassword.SPECIAL_REGEX.test(value),
    };
  }

  static isWeak(value: string): boolean {
    const lower = value.toLowerCase();

    const unique = new Set(lower);
    if (unique.size <= 2) return true;

    const digits = value.replace(/\D/g, "");
    if (digits.length >= 4) {
      if (
        FPassword.SEQ_ASC.includes(digits) ||
        FPassword.SEQ_DESC.includes(digits)
      ) {
        return true;
      }
    }

    for (const pattern of FPassword.KEYBOARD_PATTERNS) {
      if (lower.includes(pattern)) return true;
    }

    return false;
  }

  protected override validateRules(
    value: TPassword,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;

    const v = this.getValue();
    const strength = FPassword.getStrength(v);

    if (
      !strength.length ||
      !strength.uppercase ||
      !strength.lowercase ||
      !strength.digit ||
      !strength.special
    ) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Password must be at least" +
            " 8 characters and include" +
            " uppercase, lowercase, digit," +
            " and special character",
        ),
      );
    }

    if (FPassword.isWeak(v)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Password contains predictable patterns" +
            " (sequential digits, keyboard patterns," +
            " or repeated characters)",
        ),
      );
    }

    return OK_TRUE;
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TPassword, ExceptionValidation> {
    return TypeGuard.extractString(value, fieldPath);
  }

  static create<T = TPassword>(
    raw: T,
    fieldPath = "Password",
  ): Result<FPassword, ExceptionValidation> {
    const typed = FPassword.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPassword(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPassword, fieldPath = "Password"): FPassword {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPassword>(
    value: T,
    fieldPath = "Password",
  ): Result<FPassword, ExceptionValidation> {
    const typed = FPassword.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPassword(typed.value, fieldPath);
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

  override formatted(): TPasswordFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Secure password with minimum complexity" +
      " requirements (uppercase, lowercase," +
      " digit, special character)." +
      " At least 8 characters."
    );
  }

  override getShortDescription(): string {
    return "Password";
  }
}

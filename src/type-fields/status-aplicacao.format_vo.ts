import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export const OStatusAplicacao = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type TKeyStatusAplicacao = keyof typeof OStatusAplicacao;
export type TStatusAplicacao = (typeof OStatusAplicacao)[TKeyStatusAplicacao];

export class FStatusAplicacao extends TypeField<TStatusAplicacao, string> {
  override readonly typeInference = "FStatusAplicacao";

  override readonly config: ITypeFieldConfig<TStatusAplicacao> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 10,
    validateEnum: OStatusAplicacao,
    serializeAsString: false,
  };

  private constructor(value: TStatusAplicacao, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const resolved = FStatusAplicacao.resolveEnum(OStatusAplicacao, value, fieldPath);
    if (!resolved.success) return err(resolved.error);
    return OK_TRUE;
  }

  static create(
    raw: TStatusAplicacao,
    fieldPath = "StatusAplicacao",
  ): Result<FStatusAplicacao, ExceptionValidation> {
    const validation = FStatusAplicacao.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FStatusAplicacao(raw, fieldPath));
  }

  static createOrThrow(
    raw: TStatusAplicacao,
    fieldPath = "StatusAplicacao",
  ): FStatusAplicacao {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static fromBoolean(isActive: boolean): FStatusAplicacao {
    const status = isActive
      ? OStatusAplicacao.ACTIVE
      : OStatusAplicacao.INACTIVE;
    return FStatusAplicacao.createOrThrow(status, "StatusAplicacao");
  }

  static generate(): FStatusAplicacao {
    return FStatusAplicacao.createOrThrow(OStatusAplicacao.ACTIVE, "StatusAplicacao");
  }

  override validate(
    value: TStatusAplicacao,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FStatusAplicacao.validateRaw(value, fieldPath);
  }

  isActive(): boolean {
    return this.getValue() === OStatusAplicacao.ACTIVE;
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Status da aplicacao no sistema. ACTIVE indica aplicacao operacional, INACTIVE indica aplicacao desativada.";
  }

  override getShortDescription(): string {
    return "Status da aplicacao";
  }
}

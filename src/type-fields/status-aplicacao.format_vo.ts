import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export const OStatusAplicacao = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type TKeyStatusAplicacao = keyof typeof OStatusAplicacao;
export type TStatusAplicacao = (typeof OStatusAplicacao)[TKeyStatusAplicacao];

export class FStatusAplicacao extends TypeField<TStatusAplicacao> {
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

  static create(
    raw: TStatusAplicacao,
    fieldPath = "StatusAplicacao",
  ): Result<FStatusAplicacao, ExceptionValidation> {
    const inst = new FStatusAplicacao(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    const validateStatusAplicacao: (value: TStatusAplicacao) => boolean = (
      value,
    ) => {
      return Object.values(OStatusAplicacao).includes(value);
    };
    if (!validateStatusAplicacao(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `Status deve ser um dos valores: ${Object.values(OStatusAplicacao).join(", ")}`,
        ),
      );
    }

    return ok(true);
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

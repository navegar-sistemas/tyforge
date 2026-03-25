import { Result, err, ok, OK_TRUE } from "@tyforge/result/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export class TypeGuard {
  static isEnumKey<T extends object>(
    enumObj: T,
    value: string | number,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return Object.keys(enumObj).includes(value.toString())
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            `O valor '${value}' não é uma chave válida do enum.`,
          ),
        );
  }

  static isEnumValue<T extends object>(
    enumObj: T,
    value: string | number,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return Object.values(enumObj).includes(value)
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            `O valor '${value}' não é um valor válido do enum.`,
          ),
        );
  }

  static isHex(
    value: unknown,
    fieldPath: string,
    length?: number,
  ): Result<true, ExceptionValidation> {
    const val = String(value).toLowerCase();
    const isValid = /^0x[a-f0-9]+$/.test(val);
    if (!isValid) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "O valor deve ser um hexadecimal iniciado por 0x.",
        ),
      );
    }
    if (length && val.length !== length + 2) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `Hexadecimal deve conter ${length} dígitos úteis (sem contar o '0x').`,
        ),
      );
    }
    return OK_TRUE;
  }

  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (value instanceof Set || value instanceof Map) return value.size === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  // Variações de inteiros e números
  static isPositiveInteger(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return this.isInteger(value, fieldPath, 0);
  }

  static isNegativeInteger(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return this.isInteger(value, fieldPath, Number.MIN_SAFE_INTEGER, -1);
  }

  static isPositiveNumber(
    value: unknown,
    fieldPath: string,
    decimalPrecision = Infinity,
  ): Result<true, ExceptionValidation> {
    return this.isNumber(
      value,
      fieldPath,
      0,
      Number.MAX_SAFE_INTEGER,
      decimalPrecision,
    );
  }

  static isNegativeNumber(
    value: unknown,
    fieldPath: string,
    decimalPrecision = Infinity,
  ): Result<true, ExceptionValidation> {
    return this.isNumber(
      value,
      fieldPath,
      Number.MIN_SAFE_INTEGER,
      -Number.MIN_VALUE,
      decimalPrecision,
    );
  }

  static isString(
    value: unknown,
    fieldPath: string,
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  ): Result<string, ExceptionValidation> {
    if (typeof value !== "string") {
      return err(
        ExceptionValidation.create(fieldPath, "O valor deve ser uma string."),
      );
    }
    const trimmed = value.trim();
    if (trimmed.length > max) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `A string deve conter no máximo ${max} caracteres.`,
        ),
      );
    }
    if (trimmed.length < min) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `A string deve conter no mínimo ${min} caracteres úteis.`,
        ),
      );
    }
    return ok(trimmed);
  }

  static isNumber(
    value: unknown,
    fieldPath: string,
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    decimalPrecision = Infinity,
  ): Result<true, ExceptionValidation> {
    if (typeof value !== "number" || isNaN(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "O valor deve ser um número válido.",
        ),
      );
    }
    if (value < min) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `O valor deve ser no mínimo ${min}.`,
        ),
      );
    }
    if (value > max) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `O valor deve ser no máximo ${max}.`,
        ),
      );
    }
    const [, decimals] = value.toString().split(".");
    if ((decimals?.length ?? 0) > decimalPrecision) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `O valor deve ter no máximo ${decimalPrecision} casas decimais.`,
        ),
      );
    }
    return OK_TRUE;
  }

  static isInteger(
    value: unknown,
    fieldPath: string,
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
  ): Result<true, ExceptionValidation> {
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "O número deve ser um inteiro."),
      );
    }
    return this.isNumber(value, fieldPath, min, max, 0);
  }

  static isArray(
    value: unknown,
    fieldPath: string,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
  ): Result<true, ExceptionValidation> {
    if (!Array.isArray(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "O valor deve ser um array."),
      );
    }
    if (value.length < min) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `O array deve conter no mínimo ${min} itens.`,
        ),
      );
    }
    if (value.length > max) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          `O array deve conter no máximo ${max} itens.`,
        ),
      );
    }
    return OK_TRUE;
  }

  static isBoolean(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "boolean"
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            "O valor deve ser um booleano.",
          ),
        );
  }

  static isObject(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            "O valor deve ser um objeto válido.",
          ),
        );
  }

  static isRecord(value: unknown): value is Record<string, unknown> {
    return TypeGuard.isObject(value, "").success;
  }

  static isCallable(value: unknown): value is Function {
    return TypeGuard.isFunction(value, "").success;
  }

  static isFunction(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "function"
      ? OK_TRUE
      : err(
          ExceptionValidation.create(fieldPath, "O valor deve ser uma função."),
        );
  }

  static isNull(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return value === null
      ? OK_TRUE
      : err(ExceptionValidation.create(fieldPath, "O valor deve ser null."));
  }

  static isUndefined(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "undefined"
      ? OK_TRUE
      : err(
          ExceptionValidation.create(fieldPath, "O valor deve ser undefined."),
        );
  }

  static isDate(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return value instanceof Date && !isNaN(value.getTime())
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            "O valor deve ser uma data válida.",
          ),
        );
  }

  static isRegExp(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return value instanceof RegExp
      ? OK_TRUE
      : err(
          ExceptionValidation.create(
            fieldPath,
            "O valor deve ser uma expressão regular.",
          ),
        );
  }

  static isSymbol(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "symbol"
      ? OK_TRUE
      : err(
          ExceptionValidation.create(fieldPath, "O valor deve ser um símbolo."),
        );
  }

  static isBigInt(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return typeof value === "bigint"
      ? OK_TRUE
      : err(
          ExceptionValidation.create(fieldPath, "O valor deve ser um bigint."),
        );
  }

  static isSet(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return value instanceof Set
      ? OK_TRUE
      : err(ExceptionValidation.create(fieldPath, "O valor deve ser um Set."));
  }

  static isMap(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return value instanceof Map
      ? OK_TRUE
      : err(ExceptionValidation.create(fieldPath, "O valor deve ser um Map."));
  }

  static extractBoolean(value: unknown, fieldPath: string): Result<boolean, ExceptionValidation> {
    if (typeof value !== "boolean") {
      return err(ExceptionValidation.create(fieldPath, "O valor deve ser um booleano."));
    }
    return ok(value);
  }

  static extractArray(value: unknown, fieldPath: string, min = 0, max = Number.MAX_SAFE_INTEGER): Result<unknown[], ExceptionValidation> {
    if (!Array.isArray(value)) {
      return err(ExceptionValidation.create(fieldPath, "O valor deve ser um array."));
    }
    if (value.length < min) {
      return err(ExceptionValidation.create(fieldPath, `O array deve conter no mínimo ${min} itens.`));
    }
    if (value.length > max) {
      return err(ExceptionValidation.create(fieldPath, `O array deve conter no máximo ${max} itens.`));
    }
    return ok(value);
  }

  static extractNumber(value: unknown, fieldPath: string, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): Result<number, ExceptionValidation> {
    if (typeof value !== "number" || isNaN(value)) {
      return err(ExceptionValidation.create(fieldPath, "O valor deve ser um número válido."));
    }
    if (value < min) {
      return err(ExceptionValidation.create(fieldPath, `O valor deve ser no mínimo ${min}.`));
    }
    if (value > max) {
      return err(ExceptionValidation.create(fieldPath, `O valor deve ser no máximo ${max}.`));
    }
    return ok(value);
  }
}

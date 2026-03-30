export type TJsonSchemaType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "Date";

/**
 * Configurações comuns a todos os TypeField
 * (interno)
 */
interface BaseConfig {
  jsonSchemaType: TJsonSchemaType;
  serializeAsString?: boolean;
}

interface StringConfig extends BaseConfig {
  jsonSchemaType: "string";
  minLength: number;
  maxLength: number;
  validateEnum?: Record<string, string>;
}

interface NumberConfig extends BaseConfig {
  jsonSchemaType: "number";
  min: number;
  max: number;
  decimalPrecision: number;
  validateEnum?: Record<string, number>;
}

interface ArrayConfig extends BaseConfig {
  jsonSchemaType: "array";
  minItems?: number;
  maxItems?: number;
}

interface BooleanConfig extends BaseConfig {
  jsonSchemaType: "boolean";
  validateEnum?: Record<string, boolean>;
}

interface ObjectConfig extends BaseConfig {
  jsonSchemaType: "object";
}

interface DateConfig extends BaseConfig {
  jsonSchemaType: "Date";
}

/**
 * Configuração de validação para TypeField,
 * exigindo campos conforme o tipo primitivo TPrimitive
 */
export type ITypeFieldConfig<TPrimitive> = TPrimitive extends string
  ? StringConfig
  : TPrimitive extends number
    ? NumberConfig
    : TPrimitive extends unknown[]
      ? ArrayConfig
      : TPrimitive extends boolean
        ? BooleanConfig
        : TPrimitive extends Date
          ? DateConfig
          : TPrimitive extends object
            ? ObjectConfig
            :
  BaseConfig;

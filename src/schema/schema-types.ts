import { Result } from "@tyforge/result/result";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { Entity, IEntityProps } from "@tyforge/domain-models/entity.base";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

/**
 * Interface para tipos TypeField com método estático `create`
 */
export interface IValueObjectStatic<
  TPrimitive,
  TInstance extends TypeField<TPrimitive>,
> {
  create(value: TPrimitive, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Interface para entidades que implementam o método `create`
 */
export interface IEntityStatic<
  TInstance extends Entity<IEntityProps, unknown>,
> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Representa a configuração de um campo do schema.
 * Se `isArray === true`, o valor de entrada deve ser um array,
 * e a inferência resultará num array de primitivos/VOs/Entidades.
 */
export interface IFieldConfig {
  type:
    | IValueObjectStatic<unknown, TypeField<unknown>>
    | IEntityStatic<Entity<IEntityProps, unknown>>
    | ISchema;
  required?: boolean;
  isArray?: boolean;
  expose?: "public" | "private" | "redacted";
  label?: string;
  description?: string;
}

/**
 * Representa um objeto inline de schema, com campos aninhados.
 */
export interface ISchema {
  [key: string]: SchemaEntry;
}

/**
 * Tudo que pode aparecer como valor em um schema:
 * - um field config (com ou sem isArray)
 * - um objeto inline (aninhado)
 */
export type SchemaEntry = IFieldConfig | ISchema | [IFieldConfig];

/**
 * EXTRAÇÃO DO PRIMITIVO A PARTIR DO TYPE (para JSON):
 * - se for VO, pega TPrimitive da classe TypeField
 * - se for Entity, usa `unknown` (o caller deve especializar)
 * - se for objeto inline, usa recursão
 */
type InferPrimitive<T> =
  T extends IValueObjectStatic<infer TP, TypeField<infer TP>>
    ? TP
    : T extends IEntityStatic<Entity<IEntityProps, unknown>>
      ? unknown
      : T extends ISchema
        ? InferJson<T>
        : never;

/**
 * MONTA O TIPO DE JSON DE ENTRADA:
 * - para cada campo, se `isArray` então InferPrimitive[]; senão InferPrimitive
 * - campos `required: false` viram opcionais (`?`)
 */
export type InferJson<TSchema extends ISchema> = {
  // campos opcionais
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends IFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferPrimitive<TSchema[K]["type"]>[]
      : InferPrimitive<TSchema[K]["type"]>
    : TSchema[K] extends ISchema
      ? InferJson<TSchema[K]>
      : never;
} & {
  // campos obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends IFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferPrimitive<TSchema[K]["type"]>[]
      : InferPrimitive<TSchema[K]["type"]>
    : TSchema[K] extends ISchema
      ? InferJson<TSchema[K]>
      : never;
};

export type EnsureExtends<T extends U, U> = T;

/**
 * EXTRAÇÃO DA INSTÂNCIA (VO ou Entity) PARA PROPS:
 */
type InferInstance<T> =
  T extends IValueObjectStatic<unknown, infer TI>
    ? TI
    : T extends IEntityStatic<infer TE>
      ? TE
      : T extends ISchema
        ? InferProps<T>
        : never;

/**
 * MONTA O TIPO FINAL DE PROPS:
 * - análogo ao InferJson, mas usa InferInstance
 */
export type InferProps<TSchema extends ISchema> = {
  // opcionais
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends IFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferInstance<TSchema[K]["type"]>[]
      : InferInstance<TSchema[K]["type"]>
    : TSchema[K] extends ISchema
      ? InferProps<TSchema[K]>
      : never;
} & {
  // obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends IFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferInstance<TSchema[K]["type"]>[]
      : InferInstance<TSchema[K]["type"]>
    : TSchema[K] extends ISchema
      ? InferProps<TSchema[K]>
      : never;
};

/** @deprecated Use InferProps */
export type ISchemaInferProps<T extends ISchema> = InferProps<T>;
/** @deprecated Use InferJson */
export type ISchemaInferJson<T extends ISchema> = InferJson<T>;
/** @deprecated Use ISchema */
export type ISchemaInlineObject = ISchema;
/** @deprecated Use SchemaEntry */
export type ISchemaAllowedEntry = SchemaEntry;
/** @deprecated Use IFieldConfig */
export type ISchemaFieldConfig = IFieldConfig;

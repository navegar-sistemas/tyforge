import { Result } from "@tyforge/tools";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { Entity, IEntityPropsBase } from "@tyforge/domain-models/entity.base";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

/**
 * Interface para tipos TypeField com método estático `create`
 */
export interface ValueObjectStatic<
  TPrimitive,
  TInstance extends TypeField<TPrimitive>,
> {
  create(value: TPrimitive, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Interface para entidades que implementam o método `create`
 */
export interface EntityStatic<
  TInstance extends Entity<IEntityPropsBase, unknown>,
> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Representa a configuração de um campo do schema.
 * Se `isArray === true`, o valor de entrada deve ser um array,
 * e a inferência resultará num array de primitivos/VOs/Entidades.
 */
export interface ISchemaFieldConfig {
  type:
    | ValueObjectStatic<unknown, TypeField<unknown>>
    | EntityStatic<Entity<IEntityPropsBase, unknown>>
    | ISchemaInlineObject;
  required?: boolean;
  isArray?: boolean;
  expose?: "public" | "private" | "redacted";
  label?: string;
  description?: string;
}

/**
 * Representa um objeto inline de schema, com campos aninhados.
 */
export interface ISchemaInlineObject {
  [key: string]: ISchemaAllowedEntry;
}

/**
 * Tudo que pode aparecer como valor em um schema:
 * - um field config (com ou sem isArray)
 * - um objeto inline (aninhado)
 */
export type ISchemaAllowedEntry = ISchemaFieldConfig | ISchemaInlineObject;

/**
 * EXTRAÇÃO DO PRIMITIVO A PARTIR DO TYPE (para JSON):
 * - se for VO, pega TPrimitive da classe TypeField
 * - se for Entity, usa `unknown` (o caller deve especializar)
 * - se for objeto inline, usa recursão
 */
type InferPrimitive<T> =
  T extends ValueObjectStatic<infer TP, TypeField<infer TP>>
    ? TP
    : T extends EntityStatic<Entity<IEntityPropsBase, unknown>>
      ? unknown
      : T extends ISchemaInlineObject
        ? ISchemaInferJson<T>
        : never;

/**
 * MONTA O TIPO DE JSON DE ENTRADA:
 * - para cada campo, se `isArray` então InferPrimitive[]; senão InferPrimitive
 * - campos `required: false` viram opcionais (`?`)
 */
export type ISchemaInferJson<TSchema extends ISchemaInlineObject> = {
  // campos opcionais
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends ISchemaFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferPrimitive<TSchema[K]["type"]>[]
      : InferPrimitive<TSchema[K]["type"]>
    : TSchema[K] extends ISchemaInlineObject
      ? ISchemaInferJson<TSchema[K]>
      : never;
} & {
  // campos obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends ISchemaFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferPrimitive<TSchema[K]["type"]>[]
      : InferPrimitive<TSchema[K]["type"]>
    : TSchema[K] extends ISchemaInlineObject
      ? ISchemaInferJson<TSchema[K]>
      : never;
};

export type EnsureExtends<T extends U, U> = T;

/**
 * EXTRAÇÃO DA INSTÂNCIA (VO ou Entity) PARA PROPS:
 */
type InferInstance<T> =
  T extends ValueObjectStatic<unknown, infer TI>
    ? TI
    : T extends EntityStatic<infer TE>
      ? TE
      : T extends ISchemaInlineObject
        ? ISchemaInferProps<T>
        : never;

/**
 * MONTA O TIPO FINAL DE PROPS:
 * - análogo ao ISchemaInferJson, mas usa InferInstance
 */
export type ISchemaInferProps<TSchema extends ISchemaInlineObject> = {
  // opcionais
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends ISchemaFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferInstance<TSchema[K]["type"]>[]
      : InferInstance<TSchema[K]["type"]>
    : TSchema[K] extends ISchemaInlineObject
      ? ISchemaInferProps<TSchema[K]>
      : never;
} & {
  // obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends ISchemaFieldConfig
    ? TSchema[K] extends { isArray: true }
      ? InferInstance<TSchema[K]["type"]>[]
      : InferInstance<TSchema[K]["type"]>
    : TSchema[K] extends ISchemaInlineObject
      ? ISchemaInferProps<TSchema[K]>
      : never;
};

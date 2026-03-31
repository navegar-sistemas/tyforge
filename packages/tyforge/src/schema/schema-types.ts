import { Result } from "@tyforge/result/result";
import {
  TypeField,
  type TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { Entity, IEntityProps } from "@tyforge/domain-models/entity.base";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

export type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

export const OExposeLevel = {
  PUBLIC: "public",
  PRIVATE: "private",
  REDACTED: "redacted",
} as const;
export type TExposeLevel = (typeof OExposeLevel)[keyof typeof OExposeLevel];

export type TAssignFn<TSchema extends ISchema> = (
  data: unknown,
) => Result<InferProps<TSchema>, Exceptions>;

export interface IParallelProcessor {
  process<TSchema extends ISchema>(
    schema: TSchema,
    items: unknown[],
    options: { concurrency: number; chunkSize: number; workerTimeout?: number },
    assignFn: TAssignFn<TSchema>,
  ): Promise<IBatchCreateResult<TSchema>>;
}

export interface IBatchCreateResult<TSchema extends ISchema> {
  ok: InferProps<TSchema>[];
  errors: IBatchCreateError[];
}

export interface IBatchCreateError {
  index: number;
  error: Exceptions;
}

export interface IBatchCreateOptions {
  concurrency?: number;
  chunkSize?: number;
  workerTimeout?: number;
}

export function getVisibilityLevel(expose: TExposeLevel | undefined): number {
  const levels: Record<TExposeLevel, number> = {
    public: 1,
    private: 2,
    redacted: 3,
  };
  return levels[expose ?? "public"];
}

/**
 * Interface for TypeField types with static `create` method.
 * The generic `<T = TPrimitive>` on create allows
 * accepting `unknown` when called explicitly.
 */
export interface IValueObjectStatic<
  TPrimitive,
  TInstance extends TypeField<TPrimitive>,
> {
  create<T = TPrimitive>(
    value: T,
    fieldPath?: string,
  ): Result<TInstance, Exceptions>;
}

/**
 * Interface for entities that implement the `create` method
 */
export interface IEntityStatic<
  TInstance extends Entity<IEntityProps, unknown>,
> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Generic interface for any schema-compatible class
 * with static create/assign. Accepts ValueObjects,
 * composite VOs, or any class following the factory
 * pattern.
 */
export interface ICreatableStatic<TInstance = unknown> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
  assign?(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}

/**
 * Schema field configuration.
 * When `isArray === true`, the input value must be an array
 * and inference produces an array of primitives/VOs/Entities.
 */
interface IFieldConfigBase {
  type:
    | IValueObjectStatic<unknown, TypeField<unknown>>
    | IEntityStatic<Entity<IEntityProps, unknown>>
    | ICreatableStatic
    | ISchema;
  required?: boolean;
  expose?: TExposeLevel;
  label?: string;
  description?: string;
  validate?: {
    create?: TValidationLevel;
    assign?: TValidationLevel;
  };
}

interface IFieldConfigSingle extends IFieldConfigBase {
  isArray?: false;
  isMap?: never;
  keyType?: never;
}

interface IFieldConfigArray extends IFieldConfigBase {
  isArray: true;
  isMap?: never;
  keyType?: never;
}

interface IFieldConfigMap extends IFieldConfigBase {
  isMap: true;
  keyType: IValueObjectStatic<unknown, TypeField<unknown>>;
  isArray?: never;
}

export type IFieldConfig =
  | IFieldConfigSingle
  | IFieldConfigArray
  | IFieldConfigMap;

/**
 * Inline schema object with nested fields.
 */
export interface ISchema {
  [key: string]: SchemaEntry;
}

/**
 * Any value that can appear in a schema:
 * - a field config (with or without isArray)
 * - an inline object (nested)
 */
export type SchemaEntry = IFieldConfig | ISchema | [IFieldConfig];

/**
 * Extracts the primitive type from a schema field type (for JSON):
 * - VO: extracts TPrimitive from TypeField
 * - Entity: uses `unknown` (caller should specialize)
 * - inline object: recurses
 */
type InferPrimitive<T> =
  T extends IValueObjectStatic<infer TP, TypeField<infer TP>>
    ? TP
    : T extends IEntityStatic<Entity<IEntityProps, infer TJson>>
      ? TJson
      : T extends ICreatableStatic<infer TI>
        ? TI extends { toJSON(): infer TJ }
          ? TJ
          : unknown
        : T extends ISchema
          ? InferJson<T>
          : never;

/**
 * Builds the JSON input type:
 * - for each field, if `isArray` then InferPrimitive[];
 *   otherwise InferPrimitive
 * - fields with `required: false` become optional (`?`)
 */
type InferJsonField<T extends IFieldConfig> = T extends { isMap: true }
  ? Record<string, InferPrimitive<T["type"]>>
  : T extends { isArray: true }
    ? InferPrimitive<T["type"]>[]
    : InferPrimitive<T["type"]>;

export type InferJson<TSchema extends ISchema> = {
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends IFieldConfig
    ? InferJsonField<TSchema[K]>
    : TSchema[K] extends ISchema
      ? InferJson<TSchema[K]>
      : never;
} & {
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends IFieldConfig
    ? InferJsonField<TSchema[K]>
    : TSchema[K] extends ISchema
      ? InferJson<TSchema[K]>
      : never;
};

/**
 * Extracts the instance type (VO or Entity) for props:
 */
type InferInstance<T> =
  T extends IValueObjectStatic<unknown, infer TI>
    ? TI
    : T extends IEntityStatic<infer TE>
      ? TE
      : T extends ICreatableStatic<infer TI>
        ? TI
        : T extends ISchema
          ? InferProps<T>
          : never;

/**
 * Builds the final props type:
 * - analogous to InferJson, but uses InferInstance
 */
type InferPropsField<T extends IFieldConfig> = T extends { isMap: true }
  ? Record<string, InferInstance<T["type"]>>
  : T extends { isArray: true }
    ? InferInstance<T["type"]>[]
    : InferInstance<T["type"]>;

export type InferProps<TSchema extends ISchema> = {
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K
    : never]?: TSchema[K] extends IFieldConfig
    ? InferPropsField<TSchema[K]>
    : TSchema[K] extends ISchema
      ? InferProps<TSchema[K]>
      : never;
} & {
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never
    : K]: TSchema[K] extends IFieldConfig
    ? InferPropsField<TSchema[K]>
    : TSchema[K] extends ISchema
      ? InferProps<TSchema[K]>
      : never;
};

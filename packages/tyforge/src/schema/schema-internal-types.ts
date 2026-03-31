import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { Result } from "@tyforge/result";

export type Creatable = {
  create(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
  assign?(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
};

export const enum EFieldKind {
  Creatable,
  NestedSchema,
  ArrayCreatable,
  ArrayNestedSchema,
  MapCreatable,
}

export interface ICompiledValidator {
  fields: ICompiledField[];
  execute(
    data: unknown,
    basePath: string,
    mode: "create" | "assign",
  ): Result<Record<string, unknown>, Exceptions>;
}

export interface ICompiledField {
  key: string;
  path: string;
  required: boolean;
  kind: EFieldKind;
  creatable: Creatable | null;
  keyCreatable: Creatable | null;
  hasAssign: boolean;
  nestedValidator: ICompiledValidator | null;
  assignValidateLevel: TValidationLevel;
  createValidateLevel: TValidationLevel;
}

export type Runner = (
  data: unknown,
  basePath: string,
  mode: "create" | "assign",
) => Result<Record<string, unknown>, Exceptions>;

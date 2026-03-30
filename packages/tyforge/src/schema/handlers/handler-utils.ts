import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { Result } from "@tyforge/result";
import type { Creatable, ICompiledField } from "../schema-internal-types";

export function requiredError(path: string): ExceptionValidation {
  return ExceptionValidation.create(path, "Required field missing.");
}

export function shouldUseCreateMethod(field: ICompiledField, useAssign: boolean): boolean {
  return useAssign
    ? field.assignValidateLevel === "full"
    : field.createValidateLevel === "full";
}

export function resolveCreatableMethod(
  creatable: Creatable,
  field: ICompiledField,
  useCreate: boolean,
): (value: unknown, path: string) => Result<unknown, Exceptions> {
  if (!useCreate && field.hasAssign && creatable.assign) {
    return (value, path) => creatable.assign!(value, path);
  }
  return (value, path) => creatable.create(value, path);
}

import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { ICompiledField } from "../schema-internal-types";
import type { IFieldHandler } from "./field-handler.interface";
import {
  requiredError,
  shouldUseCreateMethod,
  resolveCreatableMethod,
} from "./handler-utils";

export class CreatableHandler implements IFieldHandler {
  execute(
    field: ICompiledField,
    value: unknown,
    useAssign: boolean,
    _mode: "create" | "assign",
    props: Record<string, unknown>,
  ): Result<true, Exceptions> | null {
    if (TypeGuard.isNullish(value)) {
      if (field.required) return err(requiredError(field.path));
      return null;
    }
    if (!field.creatable) return null;
    const validate = resolveCreatableMethod(
      field.creatable,
      field,
      shouldUseCreateMethod(field, useAssign),
    );
    const result = validate(value, field.path);
    if (!result.success) return result;
    props[field.key] = result.value;
    return ok(true);
  }
}

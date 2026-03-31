import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { ICompiledField } from "../schema-internal-types";
import type { IFieldHandler } from "./field-handler.interface";
import { requiredError } from "./handler-utils";

export class ArrayNestedSchemaHandler implements IFieldHandler {
  execute(
    field: ICompiledField,
    value: unknown,
    _useAssign: boolean,
    mode: "create" | "assign",
    props: Record<string, unknown>,
  ): Result<true, Exceptions> | null {
    if (TypeGuard.isNullish(value)) {
      if (field.required) return err(requiredError(field.path));
      return null;
    }
    if (!Array.isArray(value))
      return err(ExceptionValidation.create(field.path, "Expected array."));
    if (!field.nestedValidator) return null;
    const items: unknown[] = [];
    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      const itemPath = `${field.path}[${index}]`;
      if (field.required && TypeGuard.isNullish(item))
        return err(requiredError(itemPath));
      const result = field.nestedValidator.execute(item, itemPath, mode);
      if (!result.success) return result;
      items.push(result.value);
    }
    props[field.key] = items;
    return ok(true);
  }
}

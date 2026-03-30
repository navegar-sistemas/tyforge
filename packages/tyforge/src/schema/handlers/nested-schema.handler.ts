import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { ICompiledField } from "../schema-internal-types";
import type { IFieldHandler } from "./field-handler.interface";
import { requiredError } from "./handler-utils";

export class NestedSchemaHandler implements IFieldHandler {
  execute(
    field: ICompiledField, value: unknown, _useAssign: boolean, mode: "create" | "assign", props: Record<string, unknown>,
  ): Result<true, Exceptions> | null {
    if (TypeGuard.isNullish(value)) {
      if (field.required) return err(requiredError(field.path));
      return null;
    }
    if (!field.nestedValidator) return null;
    const result = field.nestedValidator.execute(value, field.path, mode);
    if (!result.success) return result;
    props[field.key] = result.value;
    return ok(true);
  }
}

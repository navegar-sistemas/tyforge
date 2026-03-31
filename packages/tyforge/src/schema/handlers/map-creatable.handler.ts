import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
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

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class MapCreatableHandler implements IFieldHandler {
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
    if (!TypeGuard.isRecord(value))
      return err(ExceptionValidation.create(field.path, "Expected object."));
    if (!field.creatable) return null;
    const useCreate = shouldUseCreateMethod(field, useAssign);
    const validateValue = resolveCreatableMethod(
      field.creatable,
      field,
      useCreate,
    );
    const map: Record<string, unknown> = {};

    for (const [mapKey, mapValue] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(mapKey)) continue;
      if (field.keyCreatable) {
        const validateKey = resolveCreatableMethod(
          field.keyCreatable,
          field,
          useCreate,
        );
        const keyResult = validateKey(mapKey, `${field.path}.key(${mapKey})`);
        if (!keyResult.success) return keyResult;
      }
      if (field.required && TypeGuard.isNullish(mapValue))
        return err(requiredError(`${field.path}.${mapKey}`));
      const valueResult = validateValue(mapValue, `${field.path}.${mapKey}`);
      if (!valueResult.success) return valueResult;
      map[mapKey] = valueResult.value;
    }

    props[field.key] = map;
    return ok(true);
  }
}

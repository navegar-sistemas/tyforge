import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { EFieldKind } from "./schema-internal-types";
import type { ICompiledField, Runner } from "./schema-internal-types";
import type { IFieldHandler } from "./handlers/field-handler.interface";
import { CreatableHandler } from "./handlers/creatable.handler";
import { ArrayCreatableHandler } from "./handlers/array-creatable.handler";
import { NestedSchemaHandler } from "./handlers/nested-schema.handler";
import { ArrayNestedSchemaHandler } from "./handlers/array-nested-schema.handler";
import { MapCreatableHandler } from "./handlers/map-creatable.handler";
import type { SchemaCompiler } from "./schema-compiler";

export class SchemaRunner {
  private readonly handlers: ReadonlyMap<EFieldKind, IFieldHandler>;

  constructor() {
    this.handlers = new Map<EFieldKind, IFieldHandler>([
      [EFieldKind.Creatable, new CreatableHandler()],
      [EFieldKind.ArrayCreatable, new ArrayCreatableHandler()],
      [EFieldKind.NestedSchema, new NestedSchemaHandler()],
      [EFieldKind.ArrayNestedSchema, new ArrayNestedSchemaHandler()],
      [EFieldKind.MapCreatable, new MapCreatableHandler()],
    ]);
  }

  createExecuteFn(
    schema: Record<string, unknown>,
    compiler: SchemaCompiler,
  ): Runner {
    let compiled: ICompiledField[] | null = null;

    return (
      data: unknown,
      basePath: string,
      mode: "create" | "assign",
    ): Result<Record<string, unknown>, Exceptions> => {
      if (!compiled) compiled = compiler.compile(schema, basePath);

      if (!data || !TypeGuard.isRecord(data)) {
        return err(
          ExceptionValidation.create(
            basePath || "root",
            "Required data missing.",
          ),
        );
      }

      const props: Record<string, unknown> = {};
      const useAssign = mode === "assign";

      for (let i = 0; i < compiled.length; i++) {
        const field = compiled[i];
        const handler = this.handlers.get(field.kind);
        if (!handler) continue;

        const result = handler.execute(
          field,
          data[field.key],
          useAssign,
          mode,
          props,
        );
        if (result !== null && !result.success) return result;
      }

      return ok(props);
    };
  }
}

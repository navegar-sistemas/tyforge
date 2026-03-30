import { TypeGuard } from "@tyforge/tools/type_guard";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import type { Creatable, ICompiledField } from "./schema-internal-types";
import { EFieldKind } from "./schema-internal-types";
import { SchemaRunner } from "./schema-runner";

export class SchemaCompiler {
  constructor(private readonly maxDepth: number) {}

  compile(schema: Record<string, unknown>, basePath: string, depth = 0): ICompiledField[] {
    if (depth >= this.maxDepth) {
      throw new Error(`Schema nesting exceeds maximum depth of ${this.maxDepth} at path: ${basePath}`);
    }

    const fields: ICompiledField[] = [];

    for (const key of Object.keys(schema)) {
      const entry = SchemaCompiler.normalizeArraySyntax(schema[key]);
      const path = basePath ? `${basePath}.${key}` : key;

      if (SchemaCompiler.hasType(entry)) {
        const target = entry.type;
        const isArray = entry.isArray === true;
        const isMap = entry.isMap === true;
        const levels = SchemaCompiler.extractValidateLevels(entry);

        if (isMap && SchemaCompiler.isCreatable(target)) {
          fields.push(SchemaCompiler.buildMapField(key, path, entry, target, levels));
        } else if (SchemaCompiler.isCreatable(target)) {
          fields.push(SchemaCompiler.buildCreatableField(key, path, entry, target, isArray, levels));
        } else if (target && TypeGuard.isRecord(target)) {
          fields.push(this.buildNestedField(key, path, entry.required !== false, target, isArray, depth, levels));
        }
      } else if (entry && TypeGuard.isRecord(entry)) {
        fields.push(this.buildNestedField(key, path, true, entry, false, depth, {
          assignValidateLevel: "type",
          createValidateLevel: "full",
        }));
      }
    }

    return fields;
  }

  private static hasType(entry: unknown): entry is { type: unknown; required?: boolean; isArray?: boolean; isMap?: boolean; keyType?: unknown } {
    return !!entry && typeof entry === "object" && "type" in entry;
  }

  private static isCreatable(target: unknown): target is Creatable {
    return !!target && (typeof target === "object" || typeof target === "function") && "create" in target && typeof target.create === "function";
  }

  private static hasAssign(target: Creatable): boolean {
    return typeof target.assign === "function";
  }

  private static normalizeArraySyntax(entry: unknown): unknown {
    if (Array.isArray(entry) && entry.length > 0 && SchemaCompiler.hasType(entry[0])) {
      const config = entry[0];
      if (typeof config !== "object" || config === null) return entry;
      return { type: config.type, required: config.required, isArray: true };
    }
    return entry;
  }

  private static extractValidateLevels(entry: unknown): { assignValidateLevel: TValidationLevel; createValidateLevel: TValidationLevel } {
    const defaults = { assignValidateLevel: TypeField.assignLevel, createValidateLevel: TypeField.createLevel };
    if (!TypeGuard.isRecord(entry)) return defaults;
    const validate = entry["validate"];
    if (!TypeGuard.isRecord(validate)) return defaults;
    const assign = validate["assign"];
    const create = validate["create"];
    return {
      assignValidateLevel: (assign === "full" || assign === "type" || assign === "none") ? assign : TypeField.assignLevel,
      createValidateLevel: (create === "full" || create === "type" || create === "none") ? create : TypeField.createLevel,
    };
  }

  private static buildMapField(
    key: string, path: string,
    entry: { type: unknown; required?: boolean; isMap?: boolean; keyType?: unknown },
    target: Creatable,
    levels: { assignValidateLevel: TValidationLevel; createValidateLevel: TValidationLevel },
  ): ICompiledField {
    const keyType = entry.keyType;
    return {
      key, path,
      required: entry.required !== false,
      kind: EFieldKind.MapCreatable,
      creatable: target,
      keyCreatable: keyType && SchemaCompiler.isCreatable(keyType) ? keyType : null,
      hasAssign: SchemaCompiler.hasAssign(target),
      nestedValidator: null,
      ...levels,
    };
  }

  private static buildCreatableField(
    key: string, path: string,
    entry: { required?: boolean; isArray?: boolean },
    target: Creatable,
    isArray: boolean,
    levels: { assignValidateLevel: TValidationLevel; createValidateLevel: TValidationLevel },
  ): ICompiledField {
    return {
      key, path,
      required: entry.required !== false,
      kind: isArray ? EFieldKind.ArrayCreatable : EFieldKind.Creatable,
      creatable: target,
      keyCreatable: null,
      hasAssign: SchemaCompiler.hasAssign(target),
      nestedValidator: null,
      ...levels,
    };
  }

  private buildNestedField(
    key: string, path: string,
    required: boolean,
    nestedSchema: Record<string, unknown>,
    isArray: boolean,
    depth: number,
    levels: { assignValidateLevel: TValidationLevel; createValidateLevel: TValidationLevel },
  ): ICompiledField {
    const runner = new SchemaRunner();
    return {
      key, path, required,
      kind: isArray ? EFieldKind.ArrayNestedSchema : EFieldKind.NestedSchema,
      creatable: null,
      keyCreatable: null,
      hasAssign: false,
      nestedValidator: {
        fields: this.compile(nestedSchema, path, depth + 1),
        execute: runner.createExecuteFn(nestedSchema, this),
      },
      ...levels,
    };
  }
}

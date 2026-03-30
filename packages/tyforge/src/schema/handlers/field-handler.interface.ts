import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { Result } from "@tyforge/result";
import type { ICompiledField } from "../schema-internal-types";

export interface IFieldHandler {
  execute(
    field: ICompiledField,
    value: unknown,
    useAssign: boolean,
    mode: "create" | "assign",
    props: Record<string, unknown>,
  ): Result<true, Exceptions> | null;
}

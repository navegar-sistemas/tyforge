import { DtoResponse } from "./dto-response.base";
import { Exceptions } from "@tyforge/exceptions";
import { isFailure, ok, Result } from "@tyforge/result/result";
import { FHttpStatus, THttpStatus } from "@tyforge/type-fields";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { FString } from "@tyforge/type-fields/string.format_vo";

// Interface genérica que satisfaz TDtoResponsePropsBase
export interface IDtoResponseGeneric {
  status: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
}

// Interface para JSON
export interface IDtoResponseGenericJson {
  status: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
}

export class DtoResponseGeneric
  extends DtoResponse<IDtoResponseGeneric, IDtoResponseGenericJson>
  implements IDtoResponseGeneric
{
  protected readonly _classInfo = {
    name: "DtoResponseGeneric",
    version: "1.0.0",
    description: "Generic DTO for fallback responses",
  };

  readonly status: FHttpStatus;
  readonly headers?: Record<string, TypeField<unknown>>;
  readonly body?: unknown;

  private constructor(props: IDtoResponseGeneric) {
    super();
    this.status = props.status;
    this.headers = props.headers;
    this.body = props.body;
  }

  static create(inputs: {
    status: THttpStatus;
    body?: unknown;
    headers?: Record<string, unknown>;
  }): Result<DtoResponseGeneric, Exceptions> {
    const statusResult = FHttpStatus.create(inputs.status);
    if (isFailure(statusResult)) {
      return statusResult;
    }

    let headers: Record<string, TypeField<unknown>> | undefined;
    if (inputs.headers) {
      headers = Object.fromEntries(
        Object.entries(inputs.headers).map(([key, value]) => {
          const stringValue = typeof value === "string" ? value : String(value);
          return [key, FString.createOrThrow(stringValue)];
        }),
      );
    }

    return ok(
      new DtoResponseGeneric({
        status: statusResult.value,
        body: inputs.body,
        headers,
      }),
    );
  }

  toJSON(): IDtoResponseGenericJson {
    return {
      status: this.status.getValue(),
      body: this.body,
      headers: this.headers
        ? Object.fromEntries(
            Object.entries(this.headers).map(([key, value]) => [
              key,
              value.getValue(),
            ]),
          )
        : undefined,
    };
  }
}

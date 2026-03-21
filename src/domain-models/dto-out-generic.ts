import { DtoOut } from "./dto-out.base";
import { Exceptions } from "@tyforge/exceptions";
import { err, isFailure, ok, Result } from "@tyforge/tools";
import { FHttpStatus, THttpStatus } from "@tyforge/type-fields";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { FString } from "@tyforge/type-fields/string.format_vo";

// Interface genérica que satisfaz TDtoOutPropsBase
export interface IcDtoOutGeneric {
  status: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
}

// Interface para JSON
export interface IpDtoOutGeneric {
  status: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
}

export class DtoOutGeneric
  extends DtoOut<IcDtoOutGeneric, IpDtoOutGeneric>
  implements IcDtoOutGeneric
{
  protected _classInfo = {
    name: "DtoOutGeneric",
    version: "1.0.0",
    description: "Generic DTO for fallback responses",
  };

  readonly status: FHttpStatus;
  readonly headers?: Record<string, TypeField<unknown>>;
  readonly body?: unknown;

  constructor(props: IcDtoOutGeneric) {
    super();
    this.status = props.status;
    this.headers = props.headers;
    this.body = props.body;
  }

  static create(inputs: {
    status: THttpStatus;
    body?: unknown;
    headers?: Record<string, unknown>;
  }): Result<DtoOutGeneric, Exceptions> {
    const statusResult = FHttpStatus.create(inputs.status);
    if (isFailure(statusResult)) {
      return err(statusResult.error);
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
      new DtoOutGeneric({
        status: statusResult.value,
        body: inputs.body,
        headers,
      }),
    );
  }

  toJson(): IpDtoOutGeneric {
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

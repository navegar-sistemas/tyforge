import { SchemaBuilder } from "tyforge/schema";
import { Dto, ok, isFailure } from "tyforge";
import type { Result, Exceptions } from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge/schema";
import {
  FGraphQLDocument,
  FGraphQLOperationName,
  FString,
  FInt,
  FBoolean,
  FFetchPolicy,
} from "tyforge/type-fields";

const graphqlRequestSchema = {
  query: { type: FGraphQLDocument },
  operationName: { type: FGraphQLOperationName, required: false },
  variables: { type: FString, keyType: FString, isMap: true, required: false },
  headers: { type: FString, keyType: FString, isMap: true, required: false },
  authenticated: { type: FBoolean, required: false },
  timeout: { type: FInt, required: false },
  fetchPolicy: { type: FFetchPolicy, required: false },
} satisfies ISchema;

type TDtoGraphQLRequestProps = InferProps<typeof graphqlRequestSchema>;
type TDtoGraphQLRequestJson = InferJson<typeof graphqlRequestSchema>;

const graphqlRequestValidator = SchemaBuilder.compile(graphqlRequestSchema);

export class DtoGraphQLRequest
  extends Dto<TDtoGraphQLRequestProps, TDtoGraphQLRequestJson>
  implements TDtoGraphQLRequestProps
{
  protected readonly _classInfo = {
    name: "DtoGraphQLRequest",
    version: "1.0.0",
    description: "Validated GraphQL request parameters",
  };
  protected readonly _schema = graphqlRequestSchema;

  readonly query: FGraphQLDocument;
  readonly operationName: FGraphQLOperationName | undefined;
  readonly variables: Record<string, FString> | undefined;
  readonly headers: Record<string, FString> | undefined;
  readonly authenticated: FBoolean | undefined;
  readonly timeout: FInt | undefined;
  readonly fetchPolicy: FFetchPolicy | undefined;

  private constructor(props: TDtoGraphQLRequestProps) {
    super();
    this.query = props.query;
    this.operationName = props.operationName;
    this.variables = props.variables;
    this.headers = props.headers;
    this.authenticated = props.authenticated;
    this.timeout = props.timeout;
    this.fetchPolicy = props.fetchPolicy;
  }

  static create(
    data: TDtoGraphQLRequestJson,
  ): Result<DtoGraphQLRequest, Exceptions> {
    const result = graphqlRequestValidator.create(data);
    if (isFailure(result)) return result;
    return ok(new DtoGraphQLRequest(result.value));
  }

  static assign(
    data: TDtoGraphQLRequestJson,
  ): Result<DtoGraphQLRequest, Exceptions> {
    const result = graphqlRequestValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new DtoGraphQLRequest(result.value));
  }
}

import {
  Dto, SchemaBuilder, FString, FEmail, FInt,
  isSuccess, isFailure, ok, Result, Exceptions,
} from "@tyforge/index";
import type { ISchema, InferProps, InferJson, TDtoPropsBase, TDtoPropsJson } from "@tyforge/index";

// ═══════════════════════════════════════════════════════════════════
// DTOs reutilizáveis — importados por outros exemplos
// ═══════════════════════════════════════════════════════════════════

// ─── DtoCreateAddress ───

const createAddressDtoSchema = {
  street: { type: FString },
  city: { type: FString },
  number: { type: FInt, required: false },
} satisfies ISchema;

export type TDtoCreateAddressProps = InferProps<typeof createAddressDtoSchema>;
export type TDtoCreateAddressJson = InferJson<typeof createAddressDtoSchema>;

const createAddressDtoValidator = SchemaBuilder.compile(createAddressDtoSchema);

interface TDtoCreateAddressFullProps extends TDtoPropsBase { body: TDtoCreateAddressProps }
interface TDtoCreateAddressFullJson extends TDtoPropsJson { body: TDtoCreateAddressJson }

export class DtoCreateAddress extends Dto<TDtoCreateAddressFullProps, TDtoCreateAddressFullJson> {
  protected readonly _classInfo = { name: "DtoCreateAddress", version: "1.0.0", description: "DTO de endereço" };
  readonly body: TDtoCreateAddressProps;

  private constructor(body: TDtoCreateAddressProps) {
    super();
    this.body = body;
  }

  static create(requestBody: TDtoCreateAddressJson): Result<DtoCreateAddress, Exceptions> {
    const result = createAddressDtoValidator.create(requestBody);
    if (isFailure(result)) return result;
    return ok(new DtoCreateAddress(result.value));
  }
}

// ─── DtoCreateUser ───

const createUserDtoSchema = {
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
} satisfies ISchema;

export type TDtoCreateUserProps = InferProps<typeof createUserDtoSchema>;
export type TDtoCreateUserJson = InferJson<typeof createUserDtoSchema>;

const createUserDtoValidator = SchemaBuilder.compile(createUserDtoSchema);

interface TDtoCreateUserFullProps extends TDtoPropsBase { body: TDtoCreateUserProps }
interface TDtoCreateUserFullJson extends TDtoPropsJson { body: TDtoCreateUserJson }

export class DtoCreateUser extends Dto<TDtoCreateUserFullProps, TDtoCreateUserFullJson> {
  protected readonly _classInfo = { name: "DtoCreateUser", version: "1.0.0", description: "DTO de usuário" };
  readonly body: TDtoCreateUserProps;

  private constructor(body: TDtoCreateUserProps) {
    super();
    this.body = body;
  }

  static create(requestBody: TDtoCreateUserJson): Result<DtoCreateUser, Exceptions> {
    const result = createUserDtoValidator.create(requestBody);
    if (isFailure(result)) return result;
    return ok(new DtoCreateUser(result.value));
  }
}

// ─── DtoCreateOrder ───

const createOrderDtoSchema = {
  customerName: { type: FString },
  customerEmail: { type: FEmail },
  total: { type: FInt },
} satisfies ISchema;

export type TDtoCreateOrderProps = InferProps<typeof createOrderDtoSchema>;
export type TDtoCreateOrderJson = InferJson<typeof createOrderDtoSchema>;

const createOrderDtoValidator = SchemaBuilder.compile(createOrderDtoSchema);

interface TDtoCreateOrderFullProps extends TDtoPropsBase { body: TDtoCreateOrderProps }
interface TDtoCreateOrderFullJson extends TDtoPropsJson { body: TDtoCreateOrderJson }

export class DtoCreateOrder extends Dto<TDtoCreateOrderFullProps, TDtoCreateOrderFullJson> {
  protected readonly _classInfo = { name: "DtoCreateOrder", version: "1.0.0", description: "DTO de pedido" };
  readonly body: TDtoCreateOrderProps;

  private constructor(body: TDtoCreateOrderProps) {
    super();
    this.body = body;
  }

  static create(requestBody: TDtoCreateOrderJson): Result<DtoCreateOrder, Exceptions> {
    const result = createOrderDtoValidator.create(requestBody);
    if (isFailure(result)) return result;
    return ok(new DtoCreateOrder(result.value));
  }
}

// ─── Demonstração ───

if (require.main === module) {
  console.log("=== DTOs ===\n");

  const addressDto = DtoCreateAddress.create({ street: "Rua X", city: "SP", number: 123 });
  if (isSuccess(addressDto)) console.log("AddressDto:", addressDto.value.toJSON());

  const userDto = DtoCreateUser.create({ name: "Maria", email: "maria@test.com", age: 28 });
  if (isSuccess(userDto)) console.log("UserDto:", userDto.value.toJSON());

  const orderDto = DtoCreateOrder.create({ customerName: "Maria", customerEmail: "maria@test.com", total: 15990 });
  if (isSuccess(orderDto)) console.log("OrderDto:", orderDto.value.toJSON());

  const bad = DtoCreateUser.create({ name: "", email: "invalid", age: 0 });
  if (isFailure(bad)) console.log("\nErro:", bad.error.field, "-", bad.error.detail);

  console.log("\n✅ Exemplo 11 concluído");
}

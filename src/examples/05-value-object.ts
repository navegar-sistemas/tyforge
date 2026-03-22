import {
  ValueObject, SchemaBuilder, FString, FInt,
  isSuccess, isFailure, ok, Result, Exceptions,
} from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";
import { DtoCreateAddress } from "./11-dto";

console.log("=== ValueObject ===\n");

// ─── Schema do ValueObject ───
const addressSchema = {
  street: { type: FString },
  city: { type: FString },
  number: { type: FInt },
  complement: { type: FString, required: false },
} satisfies ISchema;

type TAddressProps = InferProps<typeof addressSchema>;
type TAddressJson = InferJson<typeof addressSchema>;

const addressValidator = SchemaBuilder.compile(addressSchema);

// ─── Input do create ───
type TCreateAddressInput = {
  street: FString;
  city: FString;
  number?: FInt;
};

// ─── ValueObject ───
class Address extends ValueObject<TAddressProps, TAddressJson> implements TAddressProps {
  readonly street: FString;
  readonly city: FString;
  readonly number: FInt;
  readonly complement: FString | undefined;

  protected readonly _classInfo = { name: "Address", version: "1.0.0", description: "Endereço" };

  private constructor(props: TAddressProps) {
    super();
    this.street = props.street;
    this.city = props.city;
    this.number = props.number;
    this.complement = props.complement;
  }

  static create(data: TCreateAddressInput): Result<Address, Exceptions> {
    return ok(new Address({
      street: data.street,
      city: data.city,
      number: data.number ?? FInt.createOrThrow(0),
      complement: undefined,
    }));
  }

  static assign(data: TAddressJson): Result<Address, Exceptions> {
    const result = addressValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new Address(result.value));
  }
}

// ─── Uso ───

// 1. DTO valida primitivos da request
const dto = DtoCreateAddress.create({ street: "Rua X", city: "São Paulo", number: 123 });

if (isSuccess(dto)) {
  // 2. ValueObject recebe TypeFields do DTO
  const addr = Address.create({
    street: dto.value.body.street,
    city: dto.value.body.city,
    number: dto.value.body.number,
  });
  if (isSuccess(addr)) {
    console.log("Address:", addr.value.toJSON());
    console.log("street:", addr.value.street.getValue());
  }
}

// Sem número — default
const dto2 = DtoCreateAddress.create({ street: "Rua Y", city: "Rio" });
if (isSuccess(dto2)) {
  const addr2 = Address.create({ street: dto2.value.body.street, city: dto2.value.body.city });
  if (isSuccess(addr2)) console.log("Sem número:", addr2.value.toJSON());
}

// equals()
if (isSuccess(dto)) {
  const a1 = Address.create({ street: dto.value.body.street, city: dto.value.body.city });
  const a2 = Address.create({ street: dto.value.body.street, city: dto.value.body.city });
  if (isSuccess(a1) && isSuccess(a2)) console.log("equals:", a1.value.equals(a2.value));
}

// assign() — banco
const fromDb = Address.assign({ street: "Rua Z", city: "BH", number: 789 });
if (isSuccess(fromDb)) console.log("assign:", fromDb.value.toJSON());

// Erro no DTO
const bad = DtoCreateAddress.create({ street: "", city: "SP" });
if (isFailure(bad)) console.log("\nErro:", bad.error.detail);

console.log("\n✅ Exemplo 05 concluído");

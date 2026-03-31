import {
  ValueObject, SchemaBuilder, FString, FInt,
  isSuccess, isFailure, ok, Result, Exceptions,
} from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge";
import { DtoCreateAddress } from "./11-dto";

console.log("=== ValueObject ===\n");

const addressSchema = {
  street: { type: FString },
  city: { type: FString },
  number: { type: FInt },
  complement: { type: FString, required: false },
} satisfies ISchema;

type TAddressProps = InferProps<typeof addressSchema>;
type TAddressJson = InferJson<typeof addressSchema>;

const addressValidator = SchemaBuilder.compile(addressSchema);

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

  static create<T = TAddressJson>(raw: T, fieldPath = "Address"): Result<Address, Exceptions> {
    const result = addressValidator.create(raw, fieldPath);
    if (isFailure(result)) return result;
    return ok(new Address(result.value));
  }

  static assign<T = TAddressJson>(raw: T, fieldPath = "Address"): Result<Address, Exceptions> {
    const result = addressValidator.assign(raw, fieldPath);
    if (isFailure(result)) return result;
    return ok(new Address(result.value));
  }
}

// 1. DTO valida primitivos da request
const dto = DtoCreateAddress.create({ street: "Rua X", city: "São Paulo", number: 123 });

if (isSuccess(dto)) {
  const addr = Address.create({
    street: dto.value.body.street.getValue(),
    city: dto.value.body.city.getValue(),
    number: dto.value.body.number?.getValue(),
  });
  if (isSuccess(addr)) {
    console.log("Address:", addr.value.toJSON());
    console.log("street:", addr.value.street.getValue());
  }
}

// Sem número — default
const dto2 = DtoCreateAddress.create({ street: "Rua Y", city: "Rio" });
if (isSuccess(dto2)) {
  const addr2 = Address.create({ street: dto2.value.body.street.getValue(), city: dto2.value.body.city.getValue() });
  if (isSuccess(addr2)) console.log("Sem número:", addr2.value.toJSON());
}

// equals()
if (isSuccess(dto)) {
  const a1 = Address.create({ street: dto.value.body.street.getValue(), city: dto.value.body.city.getValue() });
  const a2 = Address.create({ street: dto.value.body.street.getValue(), city: dto.value.body.city.getValue() });
  if (isSuccess(a1) && isSuccess(a2)) console.log("equals:", a1.value.equals(a2.value));
}

// assign() — banco
const fromDb = Address.assign({ street: "Rua Z", city: "BH", number: 789 });
if (isSuccess(fromDb)) console.log("assign:", fromDb.value.toJSON());

// Erro no DTO
const bad = DtoCreateAddress.create({ street: "", city: "SP" });
if (isFailure(bad)) console.log("\nErro:", bad.error.detail);

console.log("\n✅ Exemplo 05 concluído");

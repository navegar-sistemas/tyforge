import {
  Aggregate, SchemaBuilder, FString, FEmail, FId, FInt, FAppStatus, OAppStatus,
  isSuccess, isFailure, ok, err, Result, Exceptions, ExceptionBusiness,
} from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";
import { DtoCreateOrder } from "./11-dto";
import { EventOrderCreated } from "./13-events";

console.log("=== Aggregate + DomainEvent ===\n");

// ─── Schema ───
const orderSchema = {
  id: { type: FId, required: false },
  customerName: { type: FString },
  customerEmail: { type: FEmail },
  total: { type: FInt },
  status: { type: FAppStatus },
} satisfies ISchema;

type TOrderProps = InferProps<typeof orderSchema>;
type TOrderJson = InferJson<typeof orderSchema>;

const orderValidator = SchemaBuilder.compile(orderSchema);

// ─── Input do create ───
type TCreateOrderInput = {
  customerName: FString;
  customerEmail: FEmail;
  total: FInt;
};

// ─── Aggregate ───
class Order extends Aggregate<TOrderProps, TOrderJson> implements TOrderProps {
  readonly id: FId | undefined;
  readonly customerName: FString;
  readonly customerEmail: FEmail;
  readonly total: FInt;
  readonly status: FAppStatus;

  protected readonly _classInfo = { name: "Order", version: "1.0.0", description: "Pedido" };

  private constructor(props: TOrderProps) {
    super();
    this.id = props.id;
    this.customerName = props.customerName;
    this.customerEmail = props.customerEmail;
    this.total = props.total;
    this.status = props.status;
  }

  static create(data: TCreateOrderInput): Result<Order, Exceptions> {
    // Regra de negócio: pedido mínimo de R$ 10,00 (1000 centavos)
    if (data.total.getValue() < 1000) {
      return err(ExceptionBusiness.invalidBusinessRule("pedido mínimo é R$ 10,00"));
    }

    const id = FId.generate();
    const order = new Order({
      id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      total: data.total,
      status: FAppStatus.createOrThrow(OAppStatus.ACTIVE),
    });

    order.addDomainEvent(EventOrderCreated.create({
      orderId: id.getValue(),
      customerEmail: data.customerEmail.getValue(),
      total: data.total.getValue(),
    }));

    return ok(order);
  }

  static assign(data: TOrderJson): Result<Order, Exceptions> {
    const result = orderValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new Order(result.value));
  }
}

// ─── Uso ───

// 1. DTO valida primitivos da request
const dto = DtoCreateOrder.create({
  customerName: "Maria Silva",
  customerEmail: "maria@test.com",
  total: 15990,
});

if (isSuccess(dto)) {
  // 2. Aggregate recebe TypeFields do DTO
  const order = Order.create({
    customerName: dto.value.body.customerName,
    customerEmail: dto.value.body.customerEmail,
    total: dto.value.body.total,
  });

  if (isSuccess(order)) {
    const json = order.value.toJSON();
    console.log("Order criado:");
    console.log("  id:", json.id);
    console.log("  status:", json.status);
    console.log("  customer:", json.customerName);
    console.log("  total:", json.total);

    const events = order.value.getDomainEvents();
    console.log("\nDomain Events:", events.length);
    console.log("  event:", events[0].eventName);
    console.log("  payload:", events[0].payload);

    order.value.clearDomainEvents();
    console.log("  após clear:", order.value.getDomainEvents().length);
  }
}

// Erro de regra de negócio — pedido abaixo do mínimo
const smallDto = DtoCreateOrder.create({
  customerName: "João",
  customerEmail: "joao@test.com",
  total: 500,
});
if (isSuccess(smallDto)) {
  const small = Order.create({
    customerName: smallDto.value.body.customerName,
    customerEmail: smallDto.value.body.customerEmail,
    total: smallDto.value.body.total,
  });
  if (isFailure(small)) console.log("\nErro de negócio:", small.error.detail);
}

// assign() — banco
const fromDb = Order.assign({
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e",
  customerName: "João",
  customerEmail: "joao@test.com",
  total: 5000,
  status: "inactive",
});
if (isSuccess(fromDb)) console.log("\nOrder do banco:", fromDb.value.toJSON());

console.log("\n✅ Exemplo 07 concluído");

import { ValueObject } from "@tyforge/domain-models/value-object.base";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { Result, ok, isFailure } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import { FPageNumber } from "@tyforge/type-fields/pagination/page-number.typefield";
import { FPageSize } from "@tyforge/type-fields/pagination/page-size.typefield";
import type {
  ISchema,
  InferProps,
  InferJson,
} from "@tyforge/schema/schema-types";

const paginatedSchema = {
  totalItems: { type: FInt },
  page: { type: FPageNumber },
  pageSize: { type: FPageSize },
  totalPages: { type: FInt, required: false },
} satisfies ISchema;

type TPaginatedProps = InferProps<typeof paginatedSchema> & {
  items: unknown[];
};
type TPaginatedJson = InferJson<typeof paginatedSchema> & { items: unknown[] };

const paginatedValidator = SchemaBuilder.compile(paginatedSchema);

export class Paginated<T = unknown> extends ValueObject<
  TPaginatedProps,
  TPaginatedJson
> {
  protected readonly _classInfo = {
    name: "Paginated",
    version: "1.0.0",
    description: "Paginated result container",
  };
  protected readonly _schema = paginatedSchema;

  private _items: T[];
  private _totalItems: FInt;
  private _totalPages: FInt;
  readonly page: FPageNumber;
  readonly pageSize: FPageSize;

  private constructor(
    props: Omit<TPaginatedProps, "totalPages"> & {
      items: T[];
      totalPages: FInt;
    },
  ) {
    super();
    this._items = props.items;
    this._totalItems = props.totalItems;
    this._totalPages = props.totalPages;
    this.page = props.page;
    this.pageSize = props.pageSize;
  }

  get items(): T[] {
    return this._items;
  }

  get totalItems(): FInt {
    return this._totalItems;
  }

  get totalPages(): FInt {
    return this._totalPages;
  }

  private static extractItems<TItem>(raw: unknown): TItem[] {
    if (!TypeGuard.isRecord(raw)) return [];
    const rawItems = raw["items"];
    return Array.isArray(rawItems) ? rawItems : [];
  }

  private static buildTotalPages(totalItems: FInt, pageSize: FPageSize): FInt {
    return FInt.createOrThrow(
      Math.ceil(totalItems.getValue() / pageSize.getValue()),
    );
  }

  static create<T = unknown, TItem = unknown>(
    raw: T,
    fieldPath = "Paginated",
  ): Result<Paginated<TItem>, Exceptions> {
    const result = paginatedValidator.create(raw, fieldPath);
    if (isFailure(result)) return result;
    const items = Paginated.extractItems<TItem>(raw);
    const totalPages = Paginated.buildTotalPages(
      result.value.totalItems,
      result.value.pageSize,
    );
    return ok(new Paginated<TItem>({ ...result.value, items, totalPages }));
  }

  static assign<T = unknown, TItem = unknown>(
    raw: T,
    fieldPath = "Paginated",
  ): Result<Paginated<TItem>, Exceptions> {
    const result = paginatedValidator.assign(raw, fieldPath);
    if (isFailure(result)) return result;
    const items = Paginated.extractItems<TItem>(raw);
    const totalPages = Paginated.buildTotalPages(
      result.value.totalItems,
      result.value.pageSize,
    );
    return ok(new Paginated<TItem>({ ...result.value, items, totalPages }));
  }
}

import type { FPageNumber } from "@tyforge/type-fields/pagination/page-number.typefield";
import type { FPageSize } from "@tyforge/type-fields/pagination/page-size.typefield";
import type { FString } from "@tyforge/type-fields/primitive/string.typefield";
import type { FSortOrder } from "@tyforge/type-fields/pagination/sort-order.typefield";

export interface IPaginationParams {
  page: FPageNumber;
  pageSize: FPageSize;
  sortBy?: FString;
  sortOrder?: FSortOrder;
}

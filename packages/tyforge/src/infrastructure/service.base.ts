import { Class } from "@tyforge/domain-models/class.base";
import { ToolNetworkSecurity } from "@tyforge/tools/network-security.tool";
import type { Result } from "@tyforge/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { FString } from "@tyforge/type-fields/primitive/string.typefield";
import type { FUrlOrigin } from "@tyforge/type-fields/url/url-origin.typefield";

export abstract class ServiceBase extends Class {
  abstract readonly endpoint: FUrlOrigin;

  protected abstract getAuthHeaders(): Promise<Result<Record<string, FString>, Exceptions>>;

  protected async validateEndpointDns(): Promise<boolean> {
    const parsed = new URL(this.endpoint.getValue());
    const result = await ToolNetworkSecurity.resolveAndValidate(parsed.hostname);
    return result.valid;
  }
}

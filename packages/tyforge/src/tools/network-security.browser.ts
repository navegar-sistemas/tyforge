export class ToolNetworkSecurity {
  static isPrivateIp(_ip: string): boolean {
    return false;
  }

  static async resolveAndValidate(_hostname: string): Promise<{ valid: boolean; ip: string }> {
    return { valid: true, ip: "" };
  }
}

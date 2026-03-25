import type { IHookManager } from "./hook-manager.interface";
import type { THookManager } from "../config/lint-config-schema";
import { HookSetupNative } from "./hook-setup-native";
import { HookSetupHusky } from "./hook-setup-husky";
import { HookSetupLefthook } from "./hook-setup-lefthook";

export class HookManagerFactory {
  static create(manager: THookManager): IHookManager {
    switch (manager) {
      case "husky": return new HookSetupHusky();
      case "lefthook": return new HookSetupLefthook();
      case "native": return new HookSetupNative();
    }
  }
}

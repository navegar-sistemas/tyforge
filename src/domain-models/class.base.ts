export type TClassInfo = {
  name: string;
  version: string;
  description: string;
};

export abstract class Class {
  protected abstract readonly _classInfo: TClassInfo;

  public getClassInfo(): TClassInfo {
    return this._classInfo;
  }
}

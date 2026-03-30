/**
 * Identificação estática da classe — nome, versão do schema e descrição.
 * Definida uma vez por subclasse via `_classInfo`.
 */
export type TClassInfo = {
  name: string;
  version: string;
  description: string;
};

/**
 * Metadata dinâmico da instância — controle de revisão e timestamps.
 * - `revision`: contador para optimistic locking (incrementado via `incrementRevision()`)
 * - `createdAt`: data de criação da instância
 * - `updatedAt`: última modificação (atualizado via `touch()`)
 */
export type TClassMetadata = {
  revision: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Base abstrata de todas as classes do TyForge.
 *
 * Fornece dois conceitos separados:
 * - `_classInfo` — identificação estática (nome, versão do schema, descrição)
 * - `_metadata` — estado dinâmico da instância (revision, timestamps)
 *
 * Toda subclasse concreta deve definir `_classInfo` como `protected readonly`.
 */
export abstract class Class {
  /** Identificação da classe — obrigatório em toda subclasse concreta */
  protected abstract readonly _classInfo: TClassInfo;

  /** Metadata da instância — inicializado com revision 0 e timestamps atuais */
  protected readonly _metadata: TClassMetadata = {
    revision: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  /** Retorna a identificação estática da classe */
  public getClassInfo(): TClassInfo {
    if (!this._classInfo) {
      throw new Error(
        `${this.constructor.name} must define protected readonly _classInfo with { name, version, description }`,
      );
    }
    return this._classInfo;
  }

  /** Retorna o metadata da instância como readonly */
  public getMetadata(): Readonly<TClassMetadata> {
    return this._metadata;
  }

  /** Incrementa a revisão para optimistic locking */
  protected incrementRevision(): void {
    this._metadata.revision += 1;
  }

  /** Atualiza `updatedAt` para agora */
  protected touch(): void {
    this._metadata.updatedAt = new Date();
  }
}

import { Exceptions, ExceptionDetails } from "./base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

export class ExceptionAuth extends Exceptions {
  private constructor(details: ExceptionDetails) {
    super(details);
  }

  static invalidCredentials(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-credentials",
      title: "Credenciais Inválidas",
      detail: "As credenciais fornecidas são inválidas",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_CREDENTIALS",
    });
  }

  static invalidToken(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-token",
      title: "Token Inválido",
      detail: "O token fornecido é inválido ou expirado",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_TOKEN",
    });
  }

  static accountDisabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/account-disabled",
      title: "Conta Desabilitada",
      detail: "Esta conta foi desabilitada",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_ACCOUNT_DISABLED",
    });
  }

  static accountLocked(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/account-locked",
      title: "Conta Bloqueada",
      detail: "Esta conta foi bloqueada",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_ACCOUNT_LOCKED",
    });
  }

  static invalidSignature(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-signature",
      title: "Assinatura Inválida",
      detail: "A assinatura fornecida é inválida",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_SIGNATURE",
    });
  }

  static totpNotEnabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/totp-not-enabled",
      title: "TOTP Não Habilitado",
      detail: "TOTP não está habilitado para esta conta",
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "AUTH_TOTP_NOT_ENABLED",
    });
  }

  static invalidTotp(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-totp",
      title: "TOTP Inválido",
      detail: "O código TOTP fornecido é inválido",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_TOTP",
    });
  }

  static userNotFound(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/user-not-found",
      title: "Usuário Não Encontrado",
      detail: "O usuário solicitado não foi encontrado",
      status: OHttpStatus.NOT_FOUND,
      instance: "",
      uri: "",
      code: "AUTH_USER_NOT_FOUND",
    });
  }

  static accessDenied(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/access-denied",
      title: "Acesso Negado",
      detail: "Você não tem permissão para executar esta ação",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_ACCESS_DENIED",
    });
  }

  static replayAttackDetected(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/replay-attack-detected",
      title: "Replay Attack Detectado",
      detail: "Esta requisição já foi processada anteriormente",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_REPLAY_DETECTED",
    });
  }

  static requestExpired(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/request-expired",
      title: "Requisição Expirada",
      detail: "A requisição está fora da janela temporal permitida",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_REQUEST_EXPIRED",
    });
  }

  static totpAlreadyEnabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/totp-already-enabled",
      title: "TOTP Já Habilitado",
      detail: "TOTP já está habilitado para esta conta",
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "AUTH_TOTP_ALREADY_ENABLED",
    });
  }

  static mfaLockout(retryAfterSeconds?: number): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/mfa-lockout",
      title: "MFA Bloqueado",
      detail: "Muitas tentativas de MFA. Tente novamente mais tarde",
      status: OHttpStatus.TOO_MANY_REQUESTS,
      instance: "",
      uri: "",
      code: "AUTH_MFA_LOCKOUT",
      additionalFields: retryAfterSeconds ? { retry_after_seconds: retryAfterSeconds } : undefined,
    });
  }

  static invalidMfaCode(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-mfa-code",
      title: "Código MFA Inválido",
      detail: "O código MFA fornecido é inválido ou expirado",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_MFA_CODE",
    });
  }

  static email2faAlreadyEnabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/email2fa-already-enabled",
      title: "Email 2FA Já Habilitado",
      detail: "Autenticação por email já está habilitada para esta conta",
      status: OHttpStatus.CONFLICT,
      instance: "",
      uri: "",
      code: "AUTH_EMAIL2FA_ALREADY_ENABLED",
    });
  }

  static email2faNotEnabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/email2fa-not-enabled",
      title: "Email 2FA Não Habilitado",
      detail: "Autenticação por email não está habilitada para esta conta",
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "AUTH_EMAIL2FA_NOT_ENABLED",
    });
  }

  static codeExpiredOrNotFound(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/code-expired",
      title: "Código Expirado",
      detail: "O código de verificação expirou ou não foi encontrado",
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "AUTH_CODE_EXPIRED",
    });
  }

  static rateLimited(retryAfterSeconds?: number): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/rate-limited",
      title: "Limite de Requisições",
      detail: "Muitas requisições. Tente novamente mais tarde",
      status: OHttpStatus.TOO_MANY_REQUESTS,
      instance: "",
      uri: "",
      code: "AUTH_RATE_LIMITED",
      additionalFields: retryAfterSeconds ? { retry_after_seconds: retryAfterSeconds } : undefined,
    });
  }

  static sessionRevoked(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/session-revoked",
      title: "Sessão Revogada",
      detail: "Esta sessão foi revogada",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_SESSION_REVOKED",
    });
  }

  static tenantDisabled(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/tenant-disabled",
      title: "Tenant Desabilitado",
      detail: "O tenant associado a esta conta está desabilitado",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_TENANT_DISABLED",
    });
  }

  static invalidInviteToken(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-invite-token",
      title: "Token de Convite Inválido",
      detail: "O token de convite fornecido é inválido ou já foi utilizado",
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_INVITE_TOKEN",
    });
  }

  static invalidBackupCode(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/invalid-backup-code",
      title: "Código de Backup Inválido",
      detail: "O código de backup fornecido é inválido ou já foi utilizado",
      status: OHttpStatus.UNAUTHORIZED,
      instance: "",
      uri: "",
      code: "AUTH_INVALID_BACKUP_CODE",
    });
  }

  static stepUpRequired(scope: string): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/step-up-required",
      title: "Step-Up Necessário",
      detail: "Esta operação requer autenticação step-up",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_STEP_UP_REQUIRED",
      additionalFields: { required_scope: scope },
    });
  }

  static tenantMismatch(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/tenant-mismatch",
      title: "Tenant Incompatível",
      detail: "O tenant da requisição não corresponde ao tenant do usuário",
      status: OHttpStatus.FORBIDDEN,
      instance: "",
      uri: "",
      code: "AUTH_TENANT_MISMATCH",
    });
  }

  static mfaRequired(): ExceptionAuth {
    return new ExceptionAuth({
      type: "auth/mfa-required",
      title: "MFA Necessário",
      detail: "É necessário pelo menos um método MFA habilitado para gerar códigos de backup",
      status: OHttpStatus.BAD_REQUEST,
      instance: "",
      uri: "",
      code: "AUTH_MFA_REQUIRED",
    });
  }
}

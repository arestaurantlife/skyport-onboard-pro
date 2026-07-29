import type { AuthError, EmailOtpType } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export const PASSWORD_RESET_SESSION_KEY = "skyport-password-reset-session";

export interface PasswordResetLinkResult {
  ok: boolean;
  reason?: string;
}

interface PasswordResetLinkParams {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

export function markPasswordResetSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PASSWORD_RESET_SESSION_KEY, new Date().toISOString());
}

export function hasPasswordResetSessionMarker() {
  if (typeof window === "undefined") return false;
  return Boolean(window.sessionStorage.getItem(PASSWORD_RESET_SESSION_KEY));
}

export function clearPasswordResetSessionMarker() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PASSWORD_RESET_SESSION_KEY);
}

export function hasPasswordResetLinkParams() {
  const params = readPasswordResetLinkParams();
  return Boolean(
    params.code || params.tokenHash || params.accessToken || params.refreshToken || params.error,
  );
}

export async function completePasswordResetLink(): Promise<PasswordResetLinkResult> {
  const params = readPasswordResetLinkParams();

  if (params.error) {
    return { ok: false, reason: friendlyResetError(params.error) };
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    return finishPasswordResetLink(error);
  }

  if (params.tokenHash) {
    if (params.type !== "recovery") {
      return {
        ok: false,
        reason: "This reset link is not a password reset link. Request a new password reset email and use the newest link.",
      };
    }

    const otpType: EmailOtpType = "recovery";
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: otpType,
    });
    return finishPasswordResetLink(error);
  }

  if (params.accessToken && params.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    return finishPasswordResetLink(error);
  }

  return {
    ok: false,
    reason: "This reset link is missing its security token. Request a fresh reset email and use the newest link in your inbox.",
  };
}

function finishPasswordResetLink(error: AuthError | null): PasswordResetLinkResult {
  if (error) return { ok: false, reason: friendlyResetError(error.message) };
  markPasswordResetSession();
  return { ok: true };
}

function readPasswordResetLinkParams(): PasswordResetLinkParams {
  if (typeof window === "undefined") {
    return {
      code: null,
      tokenHash: null,
      type: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    };
  }

  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

  return {
    code: url.searchParams.get("code") ?? hash.get("code"),
    tokenHash: url.searchParams.get("token_hash") ?? hash.get("token_hash"),
    type: url.searchParams.get("type") ?? hash.get("type"),
    accessToken: hash.get("access_token") ?? url.searchParams.get("access_token"),
    refreshToken: hash.get("refresh_token") ?? url.searchParams.get("refresh_token"),
    error:
      url.searchParams.get("error_description") ??
      hash.get("error_description") ??
      url.searchParams.get("error") ??
      hash.get("error"),
  };
}

function friendlyResetError(message: string) {
  const normalized = message.replace(/[_+]/g, " ");
  if (/expired|invalid|not found|already|one-time|otp|token/i.test(normalized)) {
    return "This reset link is invalid, expired, or already used. Request a new reset email and use the newest message in your inbox.";
  }
  return normalized || "The reset link could not be verified. Request a new reset email and try again.";
}
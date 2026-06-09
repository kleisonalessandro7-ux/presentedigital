import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "presente_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getPassword() {
  return process.env.ADMIN_PASSWORD?.trim();
}

function sign(payload: string) {
  const password = getPassword();

  if (!password) {
    throw new Error("ADMIN_PASSWORD não está configurada.");
  }

  return createHmac("sha256", password).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function createAdminSessionToken() {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  const issuedAtNumber = Number(issuedAt);

  if (!issuedAt || !signature || Number.isNaN(issuedAtNumber)) {
    return false;
  }

  if (Date.now() - issuedAtNumber > ADMIN_SESSION_MAX_AGE * 1000) {
    return false;
  }

  try {
    return safeEqual(signature, sign(issuedAt));
  } catch {
    return false;
  }
}

export function isAdminPasswordConfigured() {
  return Boolean(getPassword());
}

export function isPasswordValid(password: string) {
  const adminPassword = getPassword();

  if (!adminPassword) {
    return false;
  }

  return safeEqual(sign(password), sign(adminPassword));
}

export function isAdminAuthenticated() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}

export function attachAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0
  });
}

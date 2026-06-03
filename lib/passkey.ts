export const RP_ID = process.env.PASSKEY_RP_ID || "localhost";
export const RP_NAME = process.env.PASSKEY_RP_NAME || "Vivek Y.";
export const ORIGIN =
  process.env.PASSKEY_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://vivekyarla.com"
    : "http://localhost:3000");

// Fixed single-user identity (we only ever have one admin).
export const ADMIN_USER_ID = "vivek-admin";
export const ADMIN_USER_NAME = "vivek";

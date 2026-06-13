import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;          // user id
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;          // unique token id — store in DB if you need revocation
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.JWT_ACCESS_TTL_MIN}m`,
    issuer: "itamil-recruit",
  });

export const signRefreshToken = (payload: RefreshTokenPayload): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d`,
    issuer: "itamil-recruit",
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: "itamil-recruit" });
  return decoded as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: "itamil-recruit" });
  return decoded as RefreshTokenPayload;
};

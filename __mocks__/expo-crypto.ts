/// <reference types="node" />
import { createHash, randomBytes } from "crypto";

export const CryptoDigestAlgorithm = {
  SHA256: "SHA256" as const,
  MD5: "MD5" as const,
  SHA1: "SHA1" as const,
  SHA384: "SHA384" as const,
  SHA512: "SHA512" as const,
};

export const CryptoEncoding = {
  HEX: "hex" as const,
  BASE64: "base64" as const,
};

const ALG_MAP: Record<string, string> = {
  SHA256: "sha256",
  SHA1: "sha1",
  MD5: "md5",
  SHA384: "sha384",
  SHA512: "sha512",
};

export async function digestStringAsync(
  algorithm: string,
  data: string,
  options?: { encoding?: string },
): Promise<string> {
  const nodeAlg = ALG_MAP[algorithm] ?? algorithm.toLowerCase();
  const encoding = (options?.encoding ?? "hex") as "hex" | "base64";
  return createHash(nodeAlg).update(data).digest(encoding);
}

export function getRandomBytes(byteCount: number): Uint8Array {
  return new Uint8Array(randomBytes(byteCount));
}

export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  return new Uint8Array(randomBytes(byteCount));
}

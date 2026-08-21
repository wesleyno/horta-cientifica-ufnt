import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth";

describe("local authentication crypto", () => {
  it("hashes and verifies the original password without storing it in plain text", async () => {
    const password = "Horta-segura-2026";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("senha-incorreta", hash)).toBe(false);
  });
});

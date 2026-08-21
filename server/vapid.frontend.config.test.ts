import { describe, expect, it } from "vitest";

describe("frontend Web Push configuration", () => {
  it("exposes the generated public key", () => {
    expect(process.env.VITE_VAPID_PUBLIC_KEY).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });
});

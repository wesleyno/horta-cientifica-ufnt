import { describe, expect, it } from "vitest";

describe("Web Push configuration", () => {
  it("exposes a valid VAPID configuration shape", () => {
    expect(process.env.VAPID_PUBLIC_KEY).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(process.env.VAPID_PRIVATE_KEY).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(process.env.VAPID_SUBJECT).toMatch(/^mailto:/);
  });
});

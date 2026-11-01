import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  loginSchema,
  signupSchema,
  fieldErrorsFromZod,
  safeInternalPath,
} from "./schemas";

describe("loginSchema", () => {
  it("accepts a valid email + 8+ char password", () => {
    const r = loginSchema.safeParse({
      email: "jamie@studio.com",
      password: "longenough",
    });
    assert.equal(r.success, true);
  });

  it("rejects malformed email", () => {
    const r = loginSchema.safeParse({
      email: "not-an-email",
      password: "longenough",
    });
    assert.equal(r.success, false);
    if (!r.success) {
      const errs = fieldErrorsFromZod(r.error);
      assert.match(errs.email ?? "", /valid email/i);
    }
  });

  it("rejects short password", () => {
    const r = loginSchema.safeParse({
      email: "jamie@studio.com",
      password: "short",
    });
    assert.equal(r.success, false);
    if (!r.success) {
      const errs = fieldErrorsFromZod(r.error);
      assert.match(errs.password ?? "", /at least 8/i);
    }
  });

  it("rejects missing fields", () => {
    const r = loginSchema.safeParse({});
    assert.equal(r.success, false);
  });
});

describe("signupSchema", () => {
  it("requires displayName of 2+ chars", () => {
    const r = signupSchema.safeParse({
      email: "jamie@studio.com",
      password: "longenough",
      displayName: "J",
    });
    assert.equal(r.success, false);
    if (!r.success) {
      const errs = fieldErrorsFromZod(r.error);
      assert.match(errs.displayName ?? "", /at least 2/i);
    }
  });

  it("accepts a full valid payload", () => {
    const r = signupSchema.safeParse({
      email: "jamie@studio.com",
      password: "longenough",
      displayName: "Jamie",
    });
    assert.equal(r.success, true);
  });
});

describe("safeInternalPath", () => {
  it("passes through same-origin paths", () => {
    assert.equal(safeInternalPath("/dashboard"), "/dashboard");
    assert.equal(safeInternalPath("/websites/abc"), "/websites/abc");
  });

  it("falls back on absolute URLs (open redirect)", () => {
    assert.equal(safeInternalPath("https://evil.com"), "/dashboard");
    assert.equal(safeInternalPath("http://evil.com"), "/dashboard");
  });

  it("falls back on protocol-relative URLs", () => {
    assert.equal(safeInternalPath("//evil.com"), "/dashboard");
    assert.equal(safeInternalPath("/\\evil.com"), "/dashboard");
  });

  it("falls back on empty / non-string input", () => {
    assert.equal(safeInternalPath(""), "/dashboard");
    assert.equal(safeInternalPath(undefined), "/dashboard");
    assert.equal(safeInternalPath(null), "/dashboard");
    assert.equal(safeInternalPath(42), "/dashboard");
  });

  it("respects a custom fallback", () => {
    assert.equal(safeInternalPath("", "/login"), "/login");
  });
});

describe("fieldErrorsFromZod", () => {
  it("keeps the first error per field", () => {
    const r = loginSchema.safeParse({ email: "x", password: "y" });
    assert.equal(r.success, false);
    if (!r.success) {
      const errs = fieldErrorsFromZod(r.error);
      assert.ok(errs.email);
      assert.ok(errs.password);
    }
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEnv } from "node:util";
import { bootstrap, assertDevTarget, createRunner, serializeAuthValue } from "./setup-local.mjs";

const keys = JSON.stringify([{ id: "test", publicKey: "public", privateKey: "private" }]);
test("managed JWKS JSON survives writing and reloading the env file", () => {
  const value = JSON.stringify([{ id: "test", publicKey: '{"kty":"RSA"}', privateKey: "line1\\nline2" }]);
  assert.equal(parseEnv(`JWKS=${serializeAuthValue(value)}`).JWKS, value);
});
function harness({ remote = {}, localAuth = {}, fail, complete = true } = {}) {
  const state = { ...remote };
  const calls = [];
  const saved = {};
  const run = (tool, args) => {
    calls.push([tool, ...args]);
    assert.deepEqual(args.slice(-2), ["--env-file", "selected.env"]);
    if (fail?.(tool, args)) throw new Error("injected failure");
    if (args[0] === "env" && args[1] === "get") return state[args[2]] ?? "";
    if (args[0] === "env" && args[1] === "set") state[args[2]] = args[3];
    if (tool === "kitcn" && args[0] === "dev" && complete) state.JWKS = keys;
    return "";
  };
  return {
    state, calls, saved,
    execute: () => bootstrap({ run, localAuth, target: ["--env-file", "selected.env"], siteUrl: "http://localhost:3001", saveAuth: (values) => Object.assign(saved, values) }),
  };
}

test("fresh deployment gets a placeholder before bootstrap, then real keys", () => {
  const h = harness();
  h.execute();
  assert.equal(h.state.JWKS, keys);
  assert.equal(h.state.SITE_URL, "http://localhost:3001");
  const placeholder = h.calls.findIndex((c) => c[2] === "set" && c[3] === "JWKS");
  assert(placeholder >= 0 && placeholder < h.calls.findIndex((c) => c[1] === "dev"));
});

test("existing remote keys and secret are preserved in a new checkout", () => {
  const h = harness({ remote: { JWKS: keys, BETTER_AUTH_SECRET: "existing-secret" } });
  h.execute();
  assert.deepEqual(h.saved, { JWKS: keys, BETTER_AUTH_SECRET: "existing-secret" });
  assert(!h.calls.some((c) => c[2] === "set" && c[3] === "JWKS"));
});

test("conflicting local auth material aborts before any mutation", () => {
  const h = harness({ remote: { BETTER_AUTH_SECRET: "remote" }, localAuth: { BETTER_AUTH_SECRET: "local" } });
  assert.throws(h.execute, /differs/);
  assert(h.calls.every((c) => c[2] === "get"));
});

test("stale local placeholder is replaced with existing remote keys", () => {
  const h = harness({ remote: { JWKS: keys }, localAuth: { JWKS: "[]" } });
  h.execute();
  assert.equal(h.saved.JWKS, keys);
});

test("failed env reads abort without treating the deployment as empty", () => {
  const h = harness({ fail: (_, args) => args[0] === "env" });
  assert.throws(h.execute, /injected failure/);
  assert.equal(h.calls.length, 1);
});

test("failed fresh bootstrap retains a resumable placeholder", () => {
  const h = harness({ fail: (tool) => tool === "kitcn" });
  assert.throws(h.execute, /injected failure/);
  assert.equal(h.state.JWKS, "[]");
  const retry = harness({ remote: h.state });
  retry.execute();
  assert.equal(retry.state.JWKS, keys);
});

test("failed existing bootstrap never replaces real keys with a placeholder", () => {
  const h = harness({ remote: { JWKS: keys }, fail: (tool) => tool === "kitcn" });
  assert.throws(h.execute, /injected failure/);
  assert.equal(h.state.JWKS, keys);
});

test("successful command exit without generated keys is still a setup failure", () => {
  const h = harness({ complete: false });
  assert.throws(h.execute, /incomplete/);
  assert.equal(h.calls.filter((c) => c[1] === "dev").length, 1);
});

test("production and deployment-key targeting are rejected", () => {
  for (const env of [{ CONVEX_DEPLOYMENT: "prod:test" }, { CONVEX_DEPLOY_KEY: "secret" }, {}]) {
    assert.throws(() => assertDevTarget(env));
  }
  assertDevTarget({ CONVEX_DEPLOYMENT: "local:test" });
  assertDevTarget({ CONVEX_DEPLOYMENT: "anonymous:test" });
  assertDevTarget({ CONVEX_DEPLOYMENT: "dev:test" });
});

test("CLI runner uses Node without a shell and rejects failed captured commands", () => {
  const run = createRunner(process.cwd(), (executable, args, options) => {
    assert.equal(executable, process.execPath);
    assert(args[0].endsWith("main.js"));
    assert.equal(options.shell, false);
    return { status: 1, stdout: "sensitive-value", stderr: "sensitive-value" };
  });
  assert.throws(() => run("convex", ["env", "get", "JWKS"], true), (error) => !error.message.includes("sensitive-value"));
});

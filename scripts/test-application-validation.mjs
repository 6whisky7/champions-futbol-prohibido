import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { validateApplication, usernameError, usernameSuggestion, canonicalHandle, applicationResponse, validReceipt } from "../src/lib/application-validation.ts";

let checks = 0;
function check(name, run) { run(); checks++; console.log("PASS", name); }
const payload = () => ({ name: "Equipo Ficticio", crest: "01", captain: "0", members: [0, 1, 2].map(i => ({ roblox: `Jugador_${i}`, tiktok: `@jugador.${i}` })) });
const valid = payload();
const confirm = { requirements: true, privacy: true };
check("valid roster, no substitute, optional numbers blank", () => assert.deepEqual(validateApplication(valid, { confirmations: confirm }), []));
for (const [kind, value, message] of [
  ["roblox", "Jugador⚽10", /caracteres/], ["roblox", "Jugador-10", /caracteres/],
  ["tiktok", "𝓙𝓾𝓰𝓪𝓭𝓸𝓻", /caracteres/], ["roblox", "", /Escribe/],
  ["tiktok", "https://tiktok.com/@jugador", /enlace/], ["roblox", "https://roblox.com/users/123", /enlace/],
  ["roblox", "jugador 10", /espacios/], ["tiktok", "jugador\u200b10", /caracteres/],
  ["roblox", "ab", /entre 3 y 20/], ["tiktok", "a".repeat(25), /entre 2 y 24/],
]) check(`${kind}: ${JSON.stringify(value)}`, () => assert.match(usernameError(value, kind), message));
for (const [kind, value] of [["tiktok", "@jugador.10"], ["tiktok", "jugador.10"], ["tiktok", "www.jugador"], ["tiktok", "@" + "a".repeat(24)], ["roblox", "Jugador_10"], ["roblox", " @Jugador_10 "], ["roblox", "old__account"], ["tiktok", "legacy."]])
  check(`compatible format ${kind}: ${value}`, () => assert.equal(usernameError(value, kind), undefined));
check("compatibility: existing canonical comparison, original JSON untouched", () => {
  const p = payload(); p.members[0].roblox = " @Jugador _0 "; const original = JSON.stringify(p);
  assert.equal(canonicalHandle(p.members[0].roblox), "jugador_0");
  assert.deepEqual(validateApplication(p, { strictSpaces: false }), []);
  assert.equal(JSON.stringify(p), original);
});
for (const value of ["00", "100", "1", "-1", "a1"]) check(`invalid number ${value}`, () => {
  const p = payload(); p.members[0].number = value; assert.equal(validateApplication(p)[0].field, "player-number-0");
});
check("numbers repeat and remain optional", () => { const p = payload(); p.members.forEach(m => m.number = "07"); assert.deepEqual(validateApplication(p), []); p.members[0].number = ""; assert.deepEqual(validateApplication(p), []); });
check("incomplete starter", () => { const p = payload(); p.members[1].tiktok = ""; assert.equal(validateApplication(p)[0].field, "tiktok-1"); });
check("enabled incomplete substitute; removing it removes its errors", () => { const p = payload(); p.members.push({ roblox: "", tiktok: "" }); assert.equal(validateApplication(p).length, 2); p.members.pop(); assert.deepEqual(validateApplication(p), []); });
check("canonical duplicates inside roster", () => { const p = payload(); p.members[2].tiktok = "JUGADOR.0"; assert.match(validateApplication(p)[0].message, /ya figura/); });
check("missing crest; reserved crest; voluntary waiting bypasses reservation", () => {
  const p = payload(); p.crest = ""; assert.equal(validateApplication(p)[0].field, "crest"); p.crest = "01";
  assert.equal(validateApplication(p, { reserved: ["01"] })[0].field, "crest");
  assert.deepEqual(validateApplication(p, { reserved: ["01"], waiting: true }), []);
});
check("both confirmations required independently; waiting never required", () => {
  assert.deepEqual(validateApplication(valid, { confirmations: { requirements: false, privacy: false } }).map(i => i.field), ["requirements-confirmation", "privacy-confirmation"]);
  assert.deepEqual(validateApplication(valid, { waiting: false, confirmations: confirm }), []);
});
check("team length and existing normalization, no new decorative-name ban", () => {
  for (const name of ["", "ab", "!!a", "a".repeat(61)]) assert.ok(validateApplication({ ...valid, name }).some(i => i.field === "team-name"));
  assert.deepEqual(validateApplication({ ...valid, name: "Águilas ⚽ FC" }), []);
});
check("malformed captain/roster/runtime values", () => {
  for (const value of [null, [], {}, { ...valid, members: [null, {}, "bad"] }, { ...valid, captain: "3" }]) assert.ok(validateApplication(value).length);
});
check("safe suggestion strips only spaces; emoji/decorations/URLs never become invented identities", () => {
  assert.equal(usernameSuggestion("Jugador 10", "roblox"), "Jugador10");
  for (const value of ["Jugador⚽10", "𝕵𝖚𝖌𝖆𝖉𝖔𝖗", "https://roblox.com/users/123", "ab"]) assert.equal(usernameSuggestion(value, "roblox"), null);
});
const receipt = { id: "11111111-2222-4333-8444-555555555555", state: "pending", expires_at: "2026-12-01T20:00:00.000Z" };
check("success requires real reference/state/expiry shape", () => {
  assert.ok(validReceipt(receipt)); assert.deepEqual(applicationResponse({ result: receipt }), { result: receipt });
  for (const result of [{}, { ...receipt, id: "" }, { ...receipt, state: "ok" }, { ...receipt, expires_at: null }, { ...receipt, expires_at: "invalid" }]) assert.equal(applicationResponse({ result }).uncertain, true);
  assert.ok(validReceipt({ ...receipt, state: "waiting", expires_at: null }));
  assert.ok(validReceipt({ ...receipt, state: "approved" }));
});
check("safe known conflicts and unknown server failures", () => {
  for (const error of ["Escudo o nombre reservado. Elige otro sin perder tu plantilla.", "Un integrante ya tiene una reserva activa en este evento.", "No quedan plazas. Puedes enviar a lista de espera.", "Las inscripciones están cerradas."]) {
    const r = applicationResponse({ error }); assert.ok(r.error); assert.notEqual(r.uncertain, true);
  }
  const r = applicationResponse({ error: "SQL 23505 private_tiktok secret" }); assert.equal(r.uncertain, true); assert.ok(!r.error.includes("private_tiktok"));
  assert.equal(applicationResponse(null).uncertain, true);
  for (const error of ["__proto__", "constructor", "toString"]) assert.equal(applicationResponse({ error }).uncertain, true);
});

// Exercise the real Server Action code with an isolated transport (no production requests).
const source = await readFile(new URL("../src/app/eventos/actions.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
let calls = 0, captured, transport = { data: { result: receipt }, error: null };
const exports = {};
vm.runInNewContext(compiled, { exports, Buffer, Date, process: { env: { CFP_SUBMISSION_HMAC_KEY: "isolated-test-signing-key-32-characters" } }, require(name) {
  if (name === "node:crypto") return { createHmac };
  if (name === "node:net") return { isIP };
  if (name === "next/headers") return { headers: async () => ({ get: key => key === "x-forwarded-for" ? "127.0.0.1" : null }) };
  if (name === "@/lib/supabase/server") return { createClient: async () => ({ rpc: async (name, args) => { calls++; captured = { name, args }; return transport; } }) };
  if (name === "@/lib/application-validation") return { applicationResponse, validateApplication, uncertainMessage: "Uncertain isolated response" };
  throw Error(`Unexpected import ${name}`);
} });
const id = receipt.id, key = "22222222-2222-4333-8444-555555555555";
const accept = { accepted: true, version: "isolated-v1" };
let r = await exports.submitApplication(id, valid, key, false, accept);
assert.equal(r.result.id, id); assert.equal(calls, 1);
assert.equal(captured.name, "cfp_submit_application_secure");
assert.equal(captured.args.raw_payload, JSON.stringify(valid)); assert.equal(captured.args.k, key);
const message = [id, key, String(captured.args.issued), captured.args.client_digest, "0", JSON.stringify(valid), accept.version].join("\n");
assert.equal(captured.args.proof, createHmac("sha256", "isolated-test-signing-key-32-characters").update(message).digest("hex")); checks++;
console.log("PASS Server Action preserves signature, raw JSON, key, waiting and privacy contract");
const bad = payload(); bad.members[0].roblox = "Jugador⚽10";
r = await exports.submitApplication(id, bad, key, false, accept); assert.equal(r.issues[0].field, "roblox-0"); assert.equal(calls, 1); checks++;
r = await exports.submitApplication(id, valid, key, false, { ...accept, accepted: false }); assert.ok(r.error); assert.equal(calls, 1); checks++;
transport = { data: { error: "Escudo o nombre reservado. Elige otro sin perder tu plantilla." }, error: null };
r = await exports.submitApplication(id, valid, key, false, accept); assert.match(r.error, /reservado/); checks++;
transport = { data: null, error: { message: "private SQL transport failure" } };
r = await exports.submitApplication(id, valid, key, false, accept); assert.equal(r.uncertain, true); assert.ok(!r.error.includes("SQL")); checks++;
console.log(`PASS ${checks} validation/response/server-contract checks; no database connection`);

import { chromium, webkit, devices } from "playwright";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import { setTimeout } from "node:timers";

// Own loopback-only transport; no request from this harness can reach Supabase.
const require = createRequire(import.meta.url);
const output = process.env.REGISTRATION_TEST_OUTPUT || path.resolve("output/playwright/registration-hotfix");
await fs.mkdir(output, { recursive: true });
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "cfp-signup-"));
const apiPort = Number(process.env.REGISTRATION_TEST_API_PORT || 3988), port = Number(process.env.REGISTRATION_TEST_PORT || 3238);
const base = `http://127.0.0.1:${port}`, eventId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const receiptId = "11111111-2222-4333-8444-555555555555", secret = "isolated-browser-test-signing-key-at-least-32";
let mode = "success", reserved = false;
const calls = [], receipts = new Map();
const fixture = http.createServer(async (req, res) => {
  try {
    let body = ""; for await (const chunk of req) body += chunk;
    const a = body ? JSON.parse(body) : {}, route = new URL(req.url, "http://fixture").pathname;
    let data;
    if (route === "/rest/v1/cfp_events") data = { id: eventId, name: "Copa de prueba aislada", description: "Datos ficticios · validación del formulario", starts_at: "2026-12-01T02:00:00Z", ends_at: null, capacity: 8, format: "quarters", eliminate_after_league: true, status: "published", registration_status: "open", review_hours: 72, is_test: false };
    else if (route.endsWith("/cfp_registration_status")) data = { enabled: true, version: "isolated-v1" };
    else if (route.endsWith("/cfp_public_teams")) data = reserved ? [{ id: receiptId, name: "Equipo Reservado", crest: "01", members: [], captain: "0", state: "approved" }] : [];
    else if (route.endsWith("/cfp_league_read") || route.endsWith("/cfp_knockout_read")) data = null;
    else if (route.endsWith("/cfp_submit_application_secure")) {
      const message = [a.e, a.k, String(a.issued), a.client_digest, a.waiting ? "1" : "0", a.raw_payload, a.policy_version].join("\n");
      assert.equal(a.proof, createHmac("sha256", secret).update(message).digest("hex")); calls.push(a);
      if (mode === "connection") { req.socket.destroy(); return; }
      if (mode === "slow") await new Promise(resolve => setTimeout(resolve, 500));
      const errors = { conflict: "Escudo o nombre reservado. Elige otro sin perder tu plantilla.", member: "Un integrante ya tiene una reserva activa en este evento.", full: "No quedan plazas. Puedes enviar a lista de espera.", closed: "Las inscripciones están cerradas.", unknown: "SQL SELECT private TikTok SECRET" };
      if (errors[mode]) data = { error: errors[mode] };
      else if (mode === "malformed") data = { result: { id: "", state: "pending", expires_at: null } };
      else {
        const previous = receipts.get(a.k);
        if (previous) { assert.equal(previous.raw, a.raw_payload); data = previous.data; }
        else { data = { result: { id: receiptId, state: a.waiting ? "waiting" : "pending", expires_at: a.waiting ? null : new Date(Date.now() + 72 * 3600000).toISOString() } }; receipts.set(a.k, { raw: a.raw_payload, data }); }
        if (mode === "uncertain") data = {};
      }
    } else throw Error(`Unexpected fixture route ${route}`);
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(data));
  } catch (error) { res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ message: error.message })); }
});
await new Promise(resolve => fixture.listen(apiPort, "127.0.0.1", resolve));
const intercept = path.join(temp, "intercept.mjs");
await fs.writeFile(intercept, `const original=globalThis.fetch;globalThis.fetch=(input,init)=>{const u=typeof input==='string'?input:input instanceof URL?input.href:input.url;if(u.startsWith('https://cvenqmszdmhqaeokzbnz.supabase.co'))return original('http://127.0.0.1:${apiPort}'+u.slice('https://cvenqmszdmhqaeokzbnz.supabase.co'.length),init);if(/supabase\\.co/.test(u))throw Error('Production network forbidden');return original(input,init)};`);
const logs = [];
const server = spawn(process.execPath, ["--import", pathToFileURL(intercept).href, "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { env: { ...process.env, CFP_SUBMISSION_HMAC_KEY: secret, VERCEL: "0" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
server.stdout.on("data", b => logs.push(b.toString())); server.stderr.on("data", b => logs.push(b.toString()));
const report = { transport: "Local Next Server Actions + simulated Supabase RPC; no production writes", checks: [], accessibility: [], browserErrors: [], consoleErrors: [], android: "not run", webkit: "not run" };
let browser;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function pass(name, fn) { await fn(); report.checks.push(name); console.log("PASS", name); }
try {
  let ready = false;
  for (let i = 0; i < 90; i++) { try { if ((await globalThis.fetch(`${base}/eventos/${eventId}`)).ok) { ready = true; break; } } catch { /* wait for loopback server */ } await sleep(500); }
  assert.ok(ready, logs.join("\n"));
  browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" }), page = await context.newPage();
  page.on("pageerror", error => report.browserErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") report.consoleErrors.push(message.text()); });
  const form = page.locator(".application-form");
  let visit = 0;
  async function fresh() { mode = "success"; reserved = false; await page.goto(`${base}/eventos/${eventId}?fixture=${++visit}#inscripcion`); await form.waitFor(); }
  async function fill() {
    await page.locator("#team-name").fill("Equipo Ficticio"); await page.locator("#crest").selectOption("02");
    for (let i = 0; i < 3; i++) { await page.locator(`#roblox-${i}`).fill(`Jugador_${i}`); await page.locator(`#tiktok-${i}`).fill(`@jugador.${i}`); }
    await page.locator("#requirements-confirmation").check(); await page.locator("#privacy-confirmation").check();
  }
  async function review() { await page.getByRole("button", { name: "Revisar datos", exact: true }).click(); await page.locator("#application-review").waitFor(); }
  async function send() { await page.getByRole("button", { name: "Enviar solicitud", exact: true }).click(); }
  async function error(expected) { await page.getByRole("alert").filter({ hasText: expected }).last().waitFor(); }
  await pass("missing fields: summary links, first focus and scroll; no send", async () => {
    await fresh(); const before = calls.length; await page.getByRole("button", { name: "Revisar datos" }).click();
    await page.waitForFunction(() => document.activeElement?.id === "team-name");
    assert.equal(await form.locator('[aria-invalid="true"]').count(), 10); assert.equal(calls.length, before);
    await form.locator('a[href="#tiktok-2"]').click(); await page.waitForFunction(() => document.activeElement?.id === "tiktok-2");
  });
  await pass("live invalid usernames and correction; with/without @, dot, underscore", async () => {
    await fill(); await page.locator("#roblox-0").fill("Jugador⚽10"); assert.equal(await page.locator("#roblox-0").getAttribute("aria-invalid"), "true");
    await page.locator("#tiktok-1").fill("𝓙𝓾𝓰𝓪𝓭𝓸𝓻"); await page.locator("#tiktok-1-error").waitFor();
    await page.locator("#tiktok-1").fill("https://tiktok.com/@jugador"); assert.match(await page.locator("#tiktok-1-error").innerText(), /enlace/);
    await page.locator("#roblox-0").fill("Jugador_0"); assert.equal(await page.locator("#roblox-0").getAttribute("aria-invalid"), "false");
    await page.locator("#tiktok-1").fill("jugador.1"); assert.equal(await page.locator("#tiktok-1").getAttribute("aria-invalid"), "false");
  });
  await pass("safe suggestion requires ownership confirmation", async () => {
    await page.locator("#roblox-0").fill("Jugador 0"); const suggestion = form.locator(".application-suggestion");
    assert.ok(await suggestion.getByRole("button", { name: "Usar sugerencia" }).isDisabled());
    await suggestion.getByRole("checkbox").check(); await suggestion.getByRole("button", { name: "Usar sugerencia" }).click();
    assert.equal(await page.locator("#roblox-0").inputValue(), "Jugador0");
  });
  await pass("optional substitute and numbers; invalid 100; repeated numbers; captain", async () => {
    await page.getByRole("button", { name: "Añadir suplente" }).click(); await page.getByRole("button", { name: "Revisar datos" }).click();
    assert.equal(await page.locator("#roblox-3").getAttribute("aria-invalid"), "true"); await page.getByRole("button", { name: "Quitar suplente" }).click();
    for (let i = 0; i < 3; i++) await page.locator(`#player-number-${i}`).fill("07"); await page.locator("#captain").selectOption("2");
    await page.locator("#player-number-0").fill("100"); assert.equal(await page.locator("#player-number-0").getAttribute("aria-invalid"), "true"); await page.locator("#player-number-0").fill("");
  });
  await pass("required confirmations independent; no automatic checks", async () => {
    await page.locator("#requirements-confirmation").uncheck(); await page.locator("#privacy-confirmation").uncheck();
    await page.getByRole("button", { name: "Revisar datos" }).click(); await page.waitForFunction(() => document.activeElement?.id === "requirements-confirmation");
    await page.locator("#requirements-confirmation").check(); await page.getByRole("button", { name: "Revisar datos" }).click();
    await page.waitForFunction(() => document.activeElement?.id === "privacy-confirmation"); await page.locator("#privacy-confirmation").check();
  });
  await pass("review/back preserves fields/confirmations; review is not send", async () => {
    const before = calls.length; await review(); assert.equal(calls.length, before);
    assert.match(await page.locator("#application-review").locator("..").innerText(), /Todavía no has enviado/);
    await page.getByRole("button", { name: "Volver a editar" }).click(); assert.equal(await page.locator("#roblox-0").inputValue(), "Jugador0");
    assert.equal(await page.locator("#captain").inputValue(), "2"); assert.ok(await page.locator("#privacy-confirmation").isChecked()); assert.ok(!await page.getByRole("checkbox", { name: /Enviar a lista/ }).isChecked());
  });
  await pass("canonical duplicate identifies roster field", async () => {
    await page.locator("#tiktok-2").fill("@JUGADOR.0"); assert.match(await page.locator("#tiktok-2-error").innerText(), /ya figura/); await page.locator("#tiktok-2").fill("@jugador.2");
  });
  await pass("1440/390/320/720 layouts, keyboard, reflow, reduced motion and axe", async () => {
    await page.locator("#roblox-0").fill("Jugador⚽10");
    for (const width of [1440, 390, 320, 720]) {
      await page.setViewportSize({ width, height: 900 }); await page.locator("#roblox-0").focus(); await page.locator("#roblox-0").scrollIntoViewIfNeeded();
      assert.equal(await page.locator("#roblox-0").evaluate(input => window.getComputedStyle(input).borderTopColor), "rgb(255, 146, 157)");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow at ${width}`);
      await page.screenshot({ path: path.join(output, `validation-${width}.png`) }); await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] } })).violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })));
      report.accessibility.push({ width, violations }); assert.deepEqual(violations, []);
    }
    await page.keyboard.press("Tab"); assert.ok(await page.evaluate(() => document.activeElement !== document.body)); await page.locator("#roblox-0").fill("Jugador0");
  });
  await pass("server team/crest/member conflicts preserve fields; no private details", async () => {
    for (const [nextMode, message] of [["conflict", /nombre del equipo o el escudo/], ["member", /reserva activa/], ["closed", /se han cerrado/]]) {
      await fresh(); await fill(); mode = nextMode; await review(); await send(); await error(message);
      assert.equal(await page.locator("#team-name").inputValue(), "Equipo Ficticio"); assert.equal(await page.locator("#tiktok-0").inputValue(), "@jugador.0"); assert.equal(await page.getByRole("heading", { name: /Solicitud recibida/ }).count(), 0);
    }
  });
  await pass("newly full: voluntary waiting with same key and data", async () => {
    await fresh(); await fill(); mode = "full"; await review(); await send(); await error(/cupo acaba/); const prior = calls.at(-1); mode = "success";
    await page.getByRole("checkbox", { name: /Enviar a lista/ }).check(); await review(); await send(); await page.getByRole("heading", { name: "Solicitud en lista de espera", exact: true }).waitFor();
    assert.equal(calls.at(-1).k, prior.k); assert.equal(calls.at(-1).raw_payload, prior.raw_payload); assert.equal(calls.at(-1).waiting, true);
  });
  await pass("reserved crest disabled normally and selectable in voluntary waiting", async () => {
    reserved = true; await page.goto(`${base}/eventos/${eventId}`); await form.waitFor(); assert.ok(await page.locator('#crest option[value="01"]').isDisabled());
    await page.getByRole("checkbox", { name: /Enviar a lista/ }).check(); assert.ok(!await page.locator('#crest option[value="01"]').isDisabled()); reserved = false;
  });
  await pass("uncertain saved result: no success, locked data, exact retry", async () => {
    await fresh(); await fill(); mode = "uncertain"; await review(); await send(); await error(/No podemos confirmar/); const prior = calls.at(-1);
    assert.ok(await page.locator("#team-name").isDisabled()); mode = "success"; await page.getByRole("button", { name: "Comprobar este mismo envío" }).click();
    await page.getByRole("heading", { name: "Solicitud recibida: pendiente de revisión" }).waitFor(); assert.equal(calls.at(-1).k, prior.k); assert.equal(calls.at(-1).raw_payload, prior.raw_payload);
    assert.match(await page.locator(".registration-lock").last().innerText(), /Guarda esta referencia/);
  });
  await pass("transport failure, malformed receipt, unknown SQL: no false success", async () => {
    for (const nextMode of ["connection", "malformed", "unknown"]) {
      await fresh(); await fill(); mode = nextMode; await review(); await send(); await error(/No podemos confirmar/);
      assert.equal(await page.getByRole("heading", { name: /Solicitud recibida/ }).count(), 0); assert.ok(!(await form.innerText()).includes("SECRET")); assert.equal(await page.locator("#roblox-0").inputValue(), "Jugador_0");
    }
  });
  await pass("double click: one send, indicator, actual reference", async () => {
    await fresh(); await fill(); mode = "slow"; await review(); const before = calls.length;
    await page.getByRole("button", { name: "Enviar solicitud", exact: true }).evaluate(b => { b.click(); b.click(); }); await page.getByRole("button", { name: "Enviando solicitud…", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Solicitud recibida: pendiente de revisión" }).waitFor(); assert.equal(calls.length - before, 1); await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: path.join(output, "receipt-390.png") });
  });
  await pass("Android touch emulation: error focus and mobile input hints", async () => {
    const android = await browser.newContext({ ...devices["Pixel 5"], viewport: { width: 390, height: 844 } }), ap = await android.newPage();
    await ap.goto(`${base}/eventos/${eventId}`); await ap.getByRole("button", { name: "Revisar datos" }).tap();
    await ap.waitForFunction(() => document.activeElement?.id === "team-name");
    await ap.locator("#roblox-0").fill("Jugador⚽10"); assert.equal(await ap.locator("#roblox-0").getAttribute("aria-invalid"), "true");
    assert.equal(await ap.locator("#roblox-0").getAttribute("autocapitalize"), "none"); assert.equal(await ap.locator("#player-number-0").getAttribute("inputmode"), "numeric");
    assert.ok(await ap.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)); report.android = "PASS Pixel 5 / Chromium touch emulation; no physical Android or TikTok in-app browser";
    await ap.locator("#roblox-0").scrollIntoViewIfNeeded(); await ap.screenshot({ path: path.join(output, "android-390.png") }); await android.close();
  });
  let safari;
  try { safari = await webkit.launch(); }
  catch (error) { report.webkit = `UNAVAILABLE: ${error.message.split("\n")[0]}`; }
  if (safari) {
    const sp = await safari.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await sp.goto(`${base}/eventos/${eventId}`); await sp.getByRole("button", { name: "Revisar datos" }).click(); await sp.waitForFunction(() => document.activeElement?.id === "team-name");
    assert.ok(await sp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await sp.locator("#roblox-0").fill("Jugador⚽10"); await sp.locator("#roblox-0-error").waitFor(); await sp.locator("#roblox-0").scrollIntoViewIfNeeded(); await sp.screenshot({ path: path.join(output, "webkit-390.png") });
    await sp.locator("#team-name").fill("Equipo WebKit"); await sp.locator("#crest").selectOption("03");
    for (let i = 0; i < 3; i++) { await sp.locator(`#roblox-${i}`).fill(`Webkit_${i}`); await sp.locator(`#tiktok-${i}`).fill(`@webkit.${i}`); }
    await sp.locator("#requirements-confirmation").check(); await sp.locator("#privacy-confirmation").check(); mode = "success";
    await sp.getByRole("button", { name: "Revisar datos" }).click(); await sp.getByRole("button", { name: "Enviar solicitud", exact: true }).click();
    await sp.getByRole("heading", { name: "Solicitud recibida: pendiente de revisión" }).waitFor();
    report.webkit = "PASS WebKit emulation: validation, focus, signed submit and receipt; no physical iPhone"; await safari.close();
  }
  assert.deepEqual(report.browserErrors, []);
  assert.deepEqual(report.consoleErrors, []);
} finally {
  if (browser) await browser.close(); server.kill(); await new Promise(resolve => fixture.close(resolve));
  await fs.writeFile(path.join(output, "browser-report.json"), JSON.stringify(report, null, 2)); await fs.writeFile(path.join(output, "local-server.log"), logs.join(""));
}
console.log(`PASS ${report.checks.length} browser scenarios; ${report.webkit}`);

// Local isolated PostgreSQL and test Auth/REST only. Never production credentials.
import { Client, cfg } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
const dir = process.env.CFP_TEST_DIR,
  out = path.join(dir, "final-review"),
  base = "http://127.0.0.1:3210";
const { login } = await import(
  pathToFileURL(path.join(dir, "auth-design.mjs")).href
);
await fs.mkdir(out, { recursive: true });
const db = new Client(cfg);
await db.connect();
const f = JSON.parse(
  await fs.readFile(path.join(dir, "live-fixture.json"), "utf8"),
);
const policy = (
  await db.query(
    "select active,version from cfp_private.privacy_config where singleton",
  )
).rows[0];
const e = crypto.randomUUID();
await db.query(
  "insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status) values($1,'Disponibilidad aislada',now(),8,'quarters','published','open')",
  [e],
);
const browser = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  c = await browser.newContext({ viewport: { width: 390, height: 844 } }),
  p = await c.newPage(),
  errors = [],
  steps = [];
p.on("pageerror", (x) => errors.push(x.message));
const log = (s) => {
  steps.push(s);
  console.log("PASS", s);
};
try {
  await db.query(
    "update cfp_private.privacy_config set active=false where singleton",
  );
  assert.deepEqual(
    (await (await c.request.get(base + "/api/participacion")).json()).events,
    [],
  );
  await p.goto(base + "/eventos/" + e);
  await p
    .getByRole("heading", { name: "Inscripciones no disponibles", exact: true })
    .waitFor();
  assert.equal(
    await p.locator(".application-form > button.action-link").isDisabled(),
    true,
  );
  await p.goto(base + "/eventos?inscripciones=abiertas");
  assert.equal(
    await p.getByRole("link", { name: /Inscribir mi equipo/ }).count(),
    0,
  );
  log(
    "inactive privacy blocks advertised availability, event action and submission even if existing event says open",
  );
  await db.query(
    "update cfp_private.privacy_config set active=$1,version=$2 where singleton",
    [policy.active, policy.version],
  );
  const availability = (
    await (await c.request.get(base + "/api/participacion")).json()
  ).events;
  assert.ok(availability.some((x) => x.id === e));
  log(
    "restored test-only policy re-enables available fixture without changing event",
  );
  const route = "**/api/obs/" + f.league + "/marcador*";
  await p.route(route, (r) =>
    r.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await p.goto(base + "/obs/" + f.league + "/marcador");
  await p
    .getByText("Sin actualización · se conserva la última lectura", {
      exact: true,
    })
    .waitFor();
  assert.ok(await p.locator(".obs-score").count());
  await p.unroute(route);
  await p.waitForFunction(
    () => !document.querySelector(".obs-error"),
    {},
    { timeout: 10000 },
  );
  await p.route(route, (r) =>
    r.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
  );
  await p
    .getByText("No hay datos publicados para esta vista.", { exact: true })
    .waitFor({ timeout: 10000 });
  assert.equal(await p.locator(".obs-score").count(), 0);
  log(
    "OBS503 preserves labeled last data, recovers, and404 removes former public score",
  );
  await p.screenshot({ path: out + "/obs-unavailable-mobile.png" });
  assert.deepEqual(errors, []);
} finally {
  await db.query(
    "update cfp_private.privacy_config set active=$1,version=$2 where singleton",
    [policy.active, policy.version],
  );
  await db.query("delete from public.cfp_events where id=$1", [e]);
  await db.end();
  await browser.close();
}
const profile = await fs.mkdtemp(path.join(os.tmpdir(), "cfp-live-zoom-"));
await fs.mkdir(path.join(profile, "Default"));
await fs.writeFile(
  path.join(profile, "Default", "Preferences"),
  JSON.stringify({
    partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
  }),
);
const z = await chromium.launchPersistentContext(profile, {
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  viewport: null,
  args: ["--window-size=1440,1000"],
});
try {
  await login(z);
  const q = await z.newPage();
  await q.goto(base + "/admin/live?evento=" + f.league);
  await q.evaluate(() => document.fonts.ready);
  const metrics = await q.evaluate(() => ({
    dpr: window.devicePixelRatio,
    width: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.equal(metrics.dpr, 2);
  assert.ok(metrics.scroll <= metrics.width);
  await q.getByRole("button", { name: "Menú", exact: true }).click();
  await q.keyboard.press("Escape");
  await q.getByRole("link", { name: "Marcador", exact: true }).focus();
  assert.equal(
    await q
      .getByRole("link", { name: "Marcador", exact: true })
      .evaluate((x) => x === document.activeElement),
    true,
  );
  await q.screenshot({
    path: out + "/live-native-zoom200.png",
    fullPage: true,
  });
  log(
    "LIVE native browser zoom200, no overflow, keyboard focus and mobile menu Escape",
  );
  await fs.writeFile(
    out + "/report.json",
    JSON.stringify(
      {
        status: "PASS",
        auth: "simulated locally; real PostgreSQL; OBS failure responses controlled in browser",
        steps,
        metrics,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await z.close();
}

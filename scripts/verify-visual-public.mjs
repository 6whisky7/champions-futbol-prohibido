import { Client, cfg } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const root = process.env.CFP_TEST_DIR,
  out = path.join(root, "visual-review"),
  f = JSON.parse(await fs.readFile(path.join(out, "fixtures.json"))),
  db = new Client(cfg);
await db.connect();
const e = crypto.randomUUID(),
  draft = crypto.randomUUID(),
  tag = Date.now().toString(36);
await db.query(
  "insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status) values($1,'Visual Escudos abierto',now(),8,'quarters','published','open'),($2,'DRAFT PRIVATE VISUAL',now(),8,'quarters','draft','closed')",
  [e, draft],
);
const insert = async (i) =>
  db.query("select public.cfp_submit_application($1,$2,$3,false)", [
    e,
    {
      name:
        [
          "Albatros",
          "Bufalos",
          "Castores",
          "Delfines",
          "Estrellas",
          "Falcones",
          "Gavilanes",
          "Halcones",
        ][i - 1] + " Visual",
      crest: String(i).padStart(2, "0"),
      number: "",
      captain: "0",
      members: [0, 1, 2].map((j) => ({
        roblox: "r" + tag + i + j,
        tiktok: "t" + tag + i + "." + j,
      })),
    },
    crypto.randomUUID(),
  ]);
await insert(1);
const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  ctx = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  }),
  p = await ctx.newPage(),
  errors = [],
  steps = [];
p.on("pageerror", (x) => errors.push(x.message));
const base = "http://127.0.0.1:3210",
  log = (s) => {
    steps.push(s);
    console.log("PASS", s);
  };
const json = async (route) => {
  const r = await ctx.request.get(base + route);
  assert.equal(r.status(), 200);
  return r.json();
};
try {
  const a = await json("/api/escudos?evento=" + e);
  assert.deepEqual(a.selected.reserved, ["01"]);
  assert.equal(a.selected.free, 7);
  assert.equal(a.selected.open, true);
  assert.ok(!JSON.stringify(a).includes("t" + tag));
  assert.deepEqual(
    Object.keys(a.selected).sort(),
    ["id", "name", "reserved", "free", "open"].sort(),
  );
  assert.equal(
    (await ctx.request.get(base + "/api/escudos?evento=" + draft)).status(),
    404,
  );
  assert.equal(
    (await ctx.request.get(base + "/api/ahora?evento=" + draft)).status(),
    404,
  );
  const n = await json("/api/ahora?evento=" + f.league);
  assert.equal(
    Date.parse(n.match.scheduled_at),
    Date.parse("2027-02-01T02:15:00Z"),
  );
  assert.equal(n.called, false);
  log(
    "published-only crest DTO and real calendar time, no private data or inferred LIVE",
  );
  await p.goto(base + "/?buscar=01#escudos");
  await p.getByRole("button", { name: /Ver diseño 01,/ }).click();
  const dialog = p.getByRole("dialog", { name: "Escudo 01" });
  await dialog.waitFor();
  await p.locator("#crest-event").selectOption(e);
  await p.getByText("Ocupado en este evento", { exact: true }).waitFor();
  assert.equal(
    await dialog.getByRole("link", { name: /Inscribir mi equipo/ }).count(),
    0,
  );
  await dialog.getByRole("img").evaluate((img) => img.decode());
  await p.screenshot({ path: out + "/crest-occupied-1440.png" });
  await p.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await p
      .getByRole("button", { name: /Ver diseño 01,/ })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  assert.ok(p.url().includes("buscar=01"));
  log("occupied label, no reservation, Escape focus and URL filters retained");
  await p.locator("#crest-search").fill("02");
  await p.getByRole("button", { name: /Ver diseño 02,/ }).click();
  await p.getByText("Disponible en este evento", { exact: true }).waitFor();
  const link = p.getByRole("link", {
    name: "Inscribir mi equipo con este escudo",
    exact: true,
  });
  await link.click();
  await p.locator("#crest").waitFor();
  assert.equal(await p.locator("#crest").inputValue(), "02");
  log(
    "free crest participation link prefills valid crest without creating an application",
  );
  for (let i = 2; i <= 8; i++) await insert(i);
  await p.goto(base + "/?buscar=02&escudo=02&evento=" + e + "#escudos");
  await p
    .getByRole("link", { name: "Apuntarme a la lista de espera", exact: true })
    .waitFor();
  await p.setViewportSize({ width: 390, height: 900 });
  await p.screenshot({ path: out + "/crest-waiting-390.png" });
  const bounds = await p.getByRole("dialog").boundingBox();
  assert.ok(bounds.x >= 0 && bounds.width <= 390);
  await p.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  assert.deepEqual(
    (
      await p.evaluate(() =>
        window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        }),
      )
    ).violations,
    [],
  );
  await p.locator("#crest-event").focus();
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press("Tab");
    await p.waitForTimeout(30);
    assert.ok(
      await p
        .getByRole("dialog")
        .evaluate((el) => el.contains(document.activeElement)),
      JSON.stringify(
        await p.evaluate(() => ({
          tag: document.activeElement?.tagName,
          html: document.activeElement?.outerHTML.slice(0, 250),
        })),
      ),
    );
  }
  await p.keyboard.press("Escape");
  await p.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(
    await p
      .locator("#crest-search")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  log(
    "full event permits wait without reservation; mobile dialog, focus trap, direct-link return and Axe",
  );
  await p.goto(base + "/?buscar=02#escudos");
  await p.route("**/api/escudos*", (r) =>
    r.fulfill({ status: 503, body: "{}" }),
  );
  await p.getByRole("button", { name: /Ver diseño 02,/ }).click();
  await p.getByRole("alert").waitFor();
  await p.unroute("**/api/escudos*");
  await p
    .getByRole("button", { name: "Reintentar consulta", exact: true })
    .click();
  await p.locator("#crest-event option").nth(1).waitFor({ state: "attached" });
  await p.keyboard.press("Escape");
  log("availability failure is explicit and retry restores selector");
  for (const width of [1440, 1024, 768, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base + "/#escudos");
    await p.locator("#escudos").evaluate(e=>e.scrollIntoView({block:"start",behavior:"instant"}));
    await p.waitForFunction(()=>document.querySelector('.main-nav a[href="/#escudos"]')?.getAttribute('aria-current')==='location');
    assert.equal(
      await p
        .locator('.main-nav a[href="/#escudos"]')
        .getAttribute("aria-current"),
      "location",
    );
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await p.goto(base + "/como-se-juega");
    if (await p.getByRole("button", { name: "Menú", exact: true }).isVisible())
      await p.getByRole("button", { name: "Menú", exact: true }).click();
    assert.equal(
      await p
        .getByRole("navigation", { name: "Navegación principal" })
        .getByRole("link", { name: "Cómo se juega", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    await p.screenshot({ path: out + "/navigation-" + width + ".png" });
  }
  log("active public section/page at four widths with no horizontal overflow");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.join(out, "public-report.json"),
    JSON.stringify(
      {
        status: "PASS",
        steps,
        errors,
        auth: "local Auth/REST fixture; real PostgreSQL and Next",
        fixtures: f,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
  await db.query(
    "delete from cfp_private.application_history where application_id in(select id from cfp_private.applications where event_id=$1)",
    [e],
  );
  await db.query("delete from cfp_private.applications where event_id=$1", [e]);
  await db.query("delete from public.cfp_events where id=any($1)", [
    [e, draft],
  ]);
  await db.end();
}

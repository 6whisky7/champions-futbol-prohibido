import { Client, cfg, fixture, owner } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const root = process.env.CFP_TEST_DIR,
  out = path.join(root, "visual-review"),
  f = JSON.parse(await fs.readFile(path.join(out, "fixtures.json"))),
  base = process.env.UI_BASE_URL ?? "http://127.0.0.1:3210";
assert.ok(new URL(base).hostname === "127.0.0.1");
const { login } = await import(
    pathToFileURL(path.join(root, "auth-design.mjs")).href
  ),
  db = new Client(cfg);
await db.connect();
const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  ctx = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
await login(ctx);
const p = await ctx.newPage(),
  errors = [],
  steps = [];
p.on("pageerror", (e) => errors.push(p.url() + " " + e.message));
const log = (s) => {
  steps.push(s);
  console.log("PASS", s);
};
async function ready(url) {
  await p.goto(base + url);
  await p.locator("h1").waitFor();
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(120);
}
async function checkAxe() {
  await p.addScriptTag({
    path: path.resolve("node_modules/axe-core/axe.min.js"),
  });
  assert.deepEqual(
    await p.evaluate(async () => (await window.axe.run()).violations),
    [],
  );
  assert.equal(
    await p.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
    p.url() + " " + (await p.viewportSize()).width,
  );
}
async function shot(name) {
  await p.evaluate(async () =>
    Promise.all(
      [...document.images]
        .filter(
          (x) =>
            x.loading !== "lazy" ||
            x.getBoundingClientRect().top < window.innerHeight,
        )
        .map((x) => x.decode().catch(() => {})),
    ),
  );
  await p.screenshot({ path: path.join(out, "after", name + ".png") });
}
async function post(button) {
  if (await button.getAttribute("data-confirm-action")) {
    await button.click();
    button = p
      .getByRole("dialog")
      .getByRole("button", { name: "Confirmar", exact: true });
  }
  const r = p.waitForResponse(
    (r) => r.request().method() === "POST" && r.url().startsWith(base),
  );
  await button.click();
  await r;
  await p.waitForTimeout(100);
}
async function fingerprint() {
  const snap = (
      await db.query(
        "select id,name,status,registration_status from public.cfp_events where id=any($1) order by id",
        [Object.values(f)],
      )
    ).rows,
    rows = (
      await db.query(
        "select * from cfp_private.league_matches where event_id=any($1) order by id",
        [Object.values(f)],
      )
    ).rows,
    ko = (
      await db.query(
        "select * from cfp_private.knockout_matches where event_id=any($1) order by id",
        [Object.values(f)],
      )
    ).rows;
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ snap, rows, ko }))
    .digest("hex");
}
let batch;
try {
  await fs.mkdir(path.join(out, "after"), { recursive: true });
  const baseline = JSON.parse(
    await fs.readFile(path.join(out, "baseline.json")),
  );
  assert.equal(await fingerprint(), baseline.hash);
  const routes = {
    calendar: "/admin/calendario?evento=" + f.league,
    table: "/admin/clasificacion?evento=" + f.league,
    bracket: "/admin/eliminatorias?evento=" + f.quarters,
    champion: "/eventos/" + f.champion,
    summary: "/admin?evento=" + f.league,
    large: "/admin/eliminatorias?evento=" + f.round32,
  };
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const [name, url] of Object.entries(routes)) {
      await ready(url);
      await checkAxe();
      await shot(name + "-" + width);
    }
    await ready(routes.calendar);
    await p.getByRole("tab", { name: /^Jornada 3 / }).click();
    await p.waitForURL(/jornada=3/);
    assert.equal(new URL(p.url()).searchParams.get("jornada"), "3");
    await p
      .getByRole("button", { name: /Editar partido/ })
      .first()
      .click();
    await p.waitForFunction(()=>document.activeElement?.id==="league-match-editor");
    await p.reload();
    await p.getByRole("tab", { name: /^Jornada 3 / }).waitFor();
    assert.equal(
      await p.getByRole("tab", { name: /^Jornada 3 / }).getAttribute("aria-selected"),
      "true",
    );
    await p.locator("#league-match-editor").waitFor();
    log("calendar round, progress, URL and editor survive reload " + width);
    await ready(routes.table);
    await p.locator(".form-strip [data-result=N]").first().waitFor();
    assert.match(
      await p
        .locator(".difference-cell")
        .allTextContents()
        .then((x) => x.join(" ")),
      /\+/,
    );
    assert.equal(
      await p
        .getByRole("button", {
          name: "Cerrar liguilla y conservar clasificación",
          exact: true,
        })
        .isEnabled(),
      false,
    );
    const review = await p
      .locator(".closure-review")
      .evaluate(
        (e) =>
          e.compareDocumentPosition(document.querySelector(".league-table")) &
          window.Node.DOCUMENT_POSITION_FOLLOWING,
      );
    assert.ok(review);
    if (width === 390) {
      await p.locator(".league-table-scroll").evaluate((e) => {
        e.scrollLeft = 500;
      });
      const box = await p.locator(".sticky-team").first().boundingBox(),
        scroll = await p.locator(".league-table-scroll").boundingBox();
      assert.ok(Math.abs(box.x - scroll.x) < 3);
      await p
        .locator(".league-table-scroll")
        .screenshot({ path: path.join(out, "after", "table-sticky-390.png") });
    }
  }
  log(
    "standings V/D/N, signed DG, blocked closure above table and sticky mobile team",
  );
  await p.setViewportSize({ width: 1440, height: 1000 });
  for (const format of ["quarters", "round16", "round32", "repechage"]) {
    await ready("/admin/eliminatorias?evento=" + f[format]);
    const rows = (
      await db.query(
        "select id,home_source,away_source from cfp_private.knockout_matches where event_id=$1",
        [f[format]],
      )
    ).rows;
    const expected = rows
      .flatMap((m) =>
        [m.home_source, m.away_source]
          .filter(Boolean)
          .map((s) => s + ">" + m.id),
      )
      .sort();
    await p.waitForFunction(
      (n) =>
        document.querySelectorAll(".bracket-connections path").length === n,
      expected.length,
      { timeout: 10000 },
    );
    const actual = await p
      .locator(".bracket-connections path")
      .evaluateAll((paths) =>
        paths.map((p) => p.dataset.source + ">" + p.dataset.target).sort(),
      );
    assert.deepEqual(actual, expected);
    const chip = p.locator(".ko-destination").first(),
      href = await chip.getAttribute("href");
    await chip.focus();
    assert.equal(
      await p
        .locator(href)
        .evaluate((el) => el.classList.contains("ko-target")),
      true,
    );
    await chip.click();
    assert.equal(
      await p.locator(href).evaluate((el) => el === document.activeElement),
      true,
    );
    assert.ok(
      await p
        .locator("#ko-final")
        .evaluate(
          (el) =>
            el.compareDocumentPosition(document.querySelector(".ko-bracket")) &
            window.Node.DOCUMENT_POSITION_PRECEDING,
        ),
    );
    await checkAxe();
  }
  log(
    "four formats: every connector matches persisted sources, destination focus and final review after bracket",
  );
  await p.setViewportSize({ width: 390, height: 1000 });
  await ready("/admin/eliminatorias?evento=" + f.round32);
  await p.getByRole("button", { name: "Explorar cuadro completo" }).click();
  assert.equal(await p.locator(".ko-column:visible").count(), 5);
  await p.locator(".ko-bracket").evaluate((e) => (e.scrollLeft = 800));
  await checkAxe();
  await shot("large-explore-390");
  await ready("/eventos/" + f.champion);
  const stage = p.locator(".champion-presentation");
  await stage.waitFor();
  assert.match(await stage.innerText(), /Sin marcador/);
  assert.match(await stage.innerText(), /Pase por clasificación/);
  assert.equal(await stage.locator(".champion-path li").count(), 3);
  assert.equal(
    await stage.locator(".champion-roster .roster-starters li").count(),
    3,
  );
  assert.ok(!/PRIVATE_|TikTok/.test(await stage.innerText()));
  const png = await ctx.request.get(
    base + "/eventos/" + f.champion + "/campeon/imagen",
  );
  assert.equal(png.status(), 200);
  const bytes = await png.body();
  assert.equal(bytes.readUInt32BE(16), 1080);
  assert.equal(bytes.readUInt32BE(20), 1920);
  await fs.writeFile(path.join(out, "champion-vertical.png"), bytes);
  assert.equal(
    (
      await ctx.request.get(base + "/eventos/" + f.league + "/campeon/imagen")
    ).status(),
    404,
  );
  log(
    "administrative champion, final crests, three rounds, public roster and actual 1080×1920 PNG",
  );
  await p.setViewportSize({ width: 720, height: 500 });
  await ready(routes.calendar);
  await checkAxe();
  await p.keyboard.press("Tab");
  assert.notEqual(
    await p.evaluate(() => document.activeElement?.tagName),
    "BODY",
  );
  await shot("calendar-200-percent-equivalent");
  log("200% equivalent CSS viewport, keyboard and reduced motion");
  assert.equal(await fingerprint(), baseline.hash);
  log(
    "GET and redesign leave baseline event states, league results and knockout data byte-for-byte unchanged",
  );
  // Independent mutation fixture: never alter the before/after comparison data.
  await db.query("begin");
  batch = await fixture(db, "quarters", 12);
  await db.query("delete from cfp_private.leagues where event_id=$1", [batch]);
  await owner(db);
  await db.query("select public.cfp_league_preview($1)", [batch]);
  await db.query("select public.cfp_league_action($1,'confirm',$2,0)", [
    batch,
    { reason: "Calendario aislado para probar horarios" },
  ]);
  await db.query("reset role");
  await db.query("commit");
  const read = async () => {
    await db.query("begin");
    await owner(db);
    const d = (
      await db.query("select public.cfp_league_read($1,true) d", [batch])
    ).rows[0].d;
    await db.query("commit");
    return d;
  };
  const original = await read(),
    first = original.matches.filter((m) => m.round === 1),
    target = first[1];
  await db.query(
    `create or replace function public.cfp_visual_test_fault() returns trigger language plpgsql as $$ begin if new.event_id='${batch}'::uuid and new.id='${target.id}'::uuid and new.scheduled_at is not null then raise exception 'Fallo controlado del segundo horario'; end if;return new;end $$`,
  );
  await db.query(
    "create trigger cfp_visual_fault before update on cfp_private.league_matches for each row execute function public.cfp_visual_test_fault()",
  );
  await p.setViewportSize({ width: 1440, height: 1000 });
  await ready("/admin/calendario?evento=" + batch);
  await p
    .getByRole("button", { name: "Asignar fechas a la jornada", exact: true })
    .click();
  await p.locator("#round-start").fill("2027-03-01T19:45");
  await p
    .getByRole("button", { name: "Preparar horarios sin guardar" })
    .click();
  await p
    .locator("#round-reason")
    .fill("Horarios aislados con fallo controlado");
  await p.getByRole("button", { name: "Revisar fechas", exact: true }).click();
  await post(
    p.getByRole("button", { name: "Guardar fechas revisadas", exact: true }),
  );
  await p
    .getByRole("alert")
    .filter({ hasText: "Guardado incompleto" })
    .waitFor();
  assert.match(
    await p
      .getByRole("alert")
      .filter({ hasText: "Guardado incompleto" })
      .innerText(),
    /1 de 6/,
  );
  const partial = await read();
  assert.equal(partial.revision, original.revision + 1);
  assert.equal(partial.matches.filter((m) => m.scheduled_at).length, 1);
  assert.equal(
    await p
      .getByRole("button", { name: "Guardar fechas revisadas" })
      .isEnabled(),
    false,
  );
  await shot("schedule-partial-1440");
  await db.query("drop trigger cfp_visual_fault on cfp_private.league_matches");
  await db.query("drop function public.cfp_visual_test_fault()");
  await p.getByRole("button", { name: "Volver a editar fechas" }).click();
  assert.equal(
    await p.locator("#round-reason").inputValue(),
    "Horarios aislados con fallo controlado",
  );
  await p.getByRole("button", { name: "Revisar fechas", exact: true }).click();
  const captured = p.waitForRequest(
    (r) => r.method() === "POST" && r.url().startsWith(base),
  );
  await post(p.getByRole("button", { name: "Guardar fechas revisadas" }));
  const actionRequest = await captured;
  await p.getByRole("status").filter({ hasText: "Fechas guardadas" }).waitFor();
  const complete = await read();
  assert.equal(complete.matches.filter((m) => m.scheduled_at).length, 6);
  assert.equal(
    complete.revision,
    original.revision + 6,
    "reviewed retry must skip the already saved date",
  );
  await p.getByRole("button", { name: "Revisar fechas", exact: true }).click();
  await post(p.getByRole("button", { name: "Guardar fechas revisadas" }));
  assert.equal(
    (await read()).revision,
    complete.revision,
    "identical retry must not create history or revision",
  );
  for (const m of complete.matches) {
    const old = original.matches.find((x) => x.id === m.id);
    assert.deepEqual(
      [m.home, m.away, m.hg, m.ag, m.kind],
      [old.home, old.away, old.hg, old.ag, old.kind],
    );
  }
  assert.deepEqual(complete.table, original.table);
  log(
    "round schedule: partial failure names saved matches, stale review blocks, fields survive; reviewed retry changes dates only",
  );
  const no = await b.newContext();
  assert.equal(
    (
      await no.request.get(base + "/api/admin/contadores?evento=" + batch)
    ).status(),
    401,
  );
  await no.close();
  const helper = await b.newContext();
  await login(helper, "22222222-2222-4222-8222-222222222222");
  assert.equal(
    (
      await helper.request.get(base + "/api/admin/contadores?evento=" + batch)
    ).status(),
    403,
  );
  const hp = await helper.newPage();
  await hp.goto(base + "/admin/calendario?evento=" + batch);
  await hp.waitForURL(/admin\/acceso/);
  const headers = actionRequest.headers();
  delete headers.cookie;
  delete headers.host;
  delete headers["content-length"];
  await helper.request.post(actionRequest.url(), {
    headers,
    data: actionRequest.postData(),
  });
  assert.equal((await read()).revision, complete.revision);
  await helper.close();
  log(
    "owner-only counters and screens: anonymous 401, helper 403/redirect (local simulated Auth)",
  );
  const { eventPhase } = await import("../src/lib/event-phase.ts");
  assert.equal(
    eventPhase({ status: "draft", registration_status: "closed" }, null, null)
      .index,
    0,
  );
  assert.equal(
    eventPhase(
      { status: "published", registration_status: "closed" },
      null,
      null,
    ).index,
    1,
  );
  assert.match(
    eventPhase(
      { status: "published", registration_status: "open", roster_locked: true },
      null,
      null,
    ).context,
    /reabiertas/,
  );
  assert.equal(
    eventPhase(
      { status: "published", registration_status: "closed" },
      { ...original, state: "preview" },
      null,
    ).index,
    4,
  );
  assert.equal(
    eventPhase(
      { status: "published", registration_status: "closed" },
      original,
      null,
    ).index,
    5,
  );
  log(
    "phase derives draft, published closed, reopened locked and review states without invented history",
  );
  await db.query("begin");
  await owner(db);
  await db.query("select public.cfp_league_action($1,'disqualify',$2,$3)", [
    batch,
    {
      id: complete.teams[0].id,
      reason: "Descalificación aislada para comprobar presentación",
    },
    complete.revision,
  ]);
  await db.query("commit");
  await ready("/admin/clasificacion?evento=" + batch);
  assert.match(await p.locator(".league-table").innerText(), /Excluido/);
  await checkAxe();
  log("disqualified team remains excluded in the isolated table");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.join(out, "competition-report.json"),
    JSON.stringify(
      {
        status: "PASS",
        auth: "Local simulated Auth/REST; real PostgreSQL, permissions and Next server actions. Not real Supabase Auth/PostgREST.",
        steps,
        errors,
        batch,
        baselineHash: baseline.hash,
      },
      null,
      2,
    ),
  );
} finally {
  await db
    .query(
      "drop trigger if exists cfp_visual_fault on cfp_private.league_matches",
    )
    .catch(() => {});
  await db
    .query("drop function if exists public.cfp_visual_test_fault()")
    .catch(() => {});
  await b.close();
  await db.end();
}

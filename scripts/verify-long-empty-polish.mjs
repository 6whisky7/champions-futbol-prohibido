import { Client, cfg, fixture, owner, act, read } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const root = process.env.CFP_TEST_DIR,
  out = path.join(root, "visual-review"),
  { login } = await import(
    pathToFileURL(path.join(root, "auth-design.mjs")).href
  ),
  db = new Client(cfg);
await db.connect();
const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  ctx = await b.newContext({ reducedMotion: "reduce" });
await login(ctx);
const p = await ctx.newPage(),
  errors = [],
  steps = [];
p.on("pageerror", (e) => errors.push(p.url() + " " + e.message));
const log = (s) => {
  steps.push(s);
  console.log("PASS", s);
};
let event, empty;
try {
  await db.query("begin");
  event = await fixture(db);
  const originalLeague = (
    await db.query("select * from cfp_private.leagues where event_id=$1", [
      event,
    ])
  ).rows[0];
  await db.query("delete from cfp_private.leagues where event_id=$1", [event]);
  await db.query(
    "update public.cfp_events set name=repeat('C',100) where id=$1",
    [event],
  );
  await db.query(
    "update cfp_private.applications set payload=payload||jsonb_build_object('name',left(id::text||repeat('Z',60),60)) where event_id=$1",
    [event],
  );
  for (const app of (
    await db.query(
      "select id,payload from cfp_private.applications where event_id=$1",
      [event],
    )
  ).rows) {
    const prefix = app.id.replaceAll("-", "");
    app.payload.members = [0, 1, 2, 3].map((i) => ({
      roblox: "R" + prefix.slice(0, 18) + i,
      tiktok: "T" + prefix.slice(0, 22) + i,
    }));
    await db.query(
      "update cfp_private.applications set payload=$2 where id=$1",
      [app.id, app.payload],
    );
  }
  const longTeams = originalLeague.teams.map((t) => ({
    ...t,
    name: (t.id + "Z".repeat(60)).slice(0, 60),
  }));
  await db.query(
    "insert into cfp_private.leagues(event_id,state,teams,format,rounds,qualified,final_table) values($1,'closed',$2,'quarters',4,8,$2)",
    [event, JSON.stringify(longTeams)],
  );
  await owner(db);
  await db.query("select public.cfp_knockout_preview($1)", [event]);
  await act(db, event, "confirm");
  for (let i = 1; i <= 6; i++) {
    const k = await read(db, event);
    await act(db, event, "match", {
      id: k.matches.find((m) => m.number === i).id,
      kind: "sport",
      hg: 5,
      ag: 2,
    });
  }
  let k = await read(db, event);
  const final = k.matches.find((m) => m.number === 7);
  await act(db, event, "double_absence", { id: final.id });
  await act(db, event, "double_absence", { id: final.id });
  await act(db, event, "close");
  await db.query("reset role");
  empty = await fixture(db);
  await db.query("delete from cfp_private.leagues where event_id=$1", [empty]);
  await db.query("delete from cfp_private.applications where event_id=$1", [
    empty,
  ]);
  await db.query("commit");
  for (const width of [1440, 390, 720]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/eventos/" + event,
      "/admin/eliminatorias?evento=" + event,
      "/admin/clasificacion?evento=" + event,
      "/admin?evento=" + empty,
      "/admin/solicitudes?evento=" + empty,
      "/admin/calendario?evento=" + empty,
      "/admin/eliminatorias?evento=" + empty,
    ]) {
      await p.goto("http://127.0.0.1:3210" + route);
      await p.locator("h1").waitFor();
      await p.evaluate(()=>document.fonts.ready);
      await p.waitForLoadState("networkidle");
      await p.addScriptTag({
        path: path.resolve("node_modules/axe-core/axe.min.js"),
      });
      assert.deepEqual(
        await p.evaluate(async () => (await window.axe.run()).violations),
        [],
        route,
      );
      const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
      if(overflow){await p.screenshot({path:path.join(out,'long-failure.png'),fullPage:true});console.log(await p.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).slice(0,15).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width}))))}
      assert.equal(overflow,false,route+' overflow '+width);
    }
    await p.goto("http://127.0.0.1:3210/eventos/" + event);
    await p.locator(".champion-presentation").waitFor();
    await p
      .locator(".champion-presentation")
      .screenshot({ path: path.join(out, `long-champion-${width}.png`) });
  }
  const png = await ctx.request.get(
    "http://127.0.0.1:3210/eventos/" + event + "/campeon/imagen",
  );
  assert.equal(png.status(), 200);
  await fs.writeFile(
    path.join(out, "long-champion-vertical.png"),
    await png.body(),
  );
  log(
    "100-character event and 60-character team names: champion, roster, table, bracket and vertical PNG; empty requests/calendar/bracket at 1440/390/720",
  );
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/admin",
      "/admin/eventos",
      "/admin/calendario",
      "/admin/eliminatorias",
      "/admin/solicitudes",
    ]) {
      await p.goto("http://127.0.0.1:3214" + route);
      await p.locator(".admin-empty").waitFor();
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
      );
      assert.equal(await p.locator(".admin-brand").count(), 1);
    }
    await p.goto("http://127.0.0.1:3214/admin");
    await p.locator(".admin-empty").waitFor();
    await p.screenshot({ path: path.join(out, `empty-admin-${width}.png`) });
  }
  log(
    "no-events state: shared frame stays visible, first-event route, mobile and desktop; empty event list supplied by isolated transport",
  );
  const zoomProfile = await fs.mkdtemp(
    path.join(os.tmpdir(), "cfp-admin-zoom-"),
  );
  await fs.mkdir(path.join(zoomProfile, "Default"), { recursive: true });
  await fs.writeFile(
    path.join(zoomProfile, "Default", "Preferences"),
    JSON.stringify({
      partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
    }),
  );
  const zoomContext = await chromium.launchPersistentContext(zoomProfile, {
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    viewport: null,
    args: ["--window-size=1440,1000"],
    reducedMotion: "reduce",
  });
  await login(zoomContext);
  const z = await zoomContext.newPage();
  for (const route of [
    "/admin/calendario?evento=" + event,
    "/admin/clasificacion?evento=" + event,
    "/admin/eliminatorias?evento=" + event,
    "/eventos/" + event,
  ]) {
    await z.goto("http://127.0.0.1:3210" + route);
    await z.locator("h1").waitFor();
    assert.equal(await z.evaluate(() => window.devicePixelRatio), 2);
    assert.equal(
      await z.evaluate(
        () => window.getComputedStyle(document.documentElement).zoom,
      ),
      "1",
    );
    assert.equal(
      await z.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
    );
    await z.addScriptTag({
      path: path.resolve("node_modules/axe-core/axe.min.js"),
    });
    assert.deepEqual(
      await z.evaluate(async () => (await window.axe.run()).violations),
      [],
    );
  }
  await z.screenshot({ path: path.join(out, "admin-native-zoom-200.png") });
  await zoomContext.close();
  log(
    "native Edge zoom 200%, CSS zoom 1, four competition surfaces, no overflow and Axe violations",
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.join(out, "long-empty-report.json"),
    JSON.stringify(
      {
        status: "PASS",
        auth: "Simulated local Auth/REST; real PostgreSQL fixture data. Empty event list is supplied by a separate loopback test adapter.",
        events: [event, empty],
        steps,
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
  await b.close();
}

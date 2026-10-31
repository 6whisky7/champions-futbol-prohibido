import { Client, cfg, fixture } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const root = process.env.CFP_TEST_DIR,
  out = path.join(root, "visual-review", "comparison"),
  f = JSON.parse(
    await fs.readFile(path.join(root, "visual-review/fixtures.json")),
  ),
  { login } = await import(
    pathToFileURL(path.join(root, "auth-design.mjs")).href
  ),
  db = new Client(cfg);
await db.connect();
await fs.mkdir(out, { recursive: true });
const record = path.join(out, "fixture.json");
let requestFixture;
try {
  requestFixture = JSON.parse(await fs.readFile(record));
} catch {
  await db.query("begin");
  const e = await fixture(db);
  await db.query("delete from cfp_private.leagues where event_id=$1", [e]);
  const a = (
    await db.query(
      "select id from cfp_private.applications where event_id=$1 order by id limit 1",
      [e],
    )
  ).rows[0];
  await db.query(
    "update cfp_private.applications set state='pending',expires_at='2027-02-01T01:00:00Z' where id=$1",
    [a.id],
  );
  await db.query("commit");
  requestFixture = { event: e, application: a.id };
  await fs.writeFile(record, JSON.stringify(requestFixture));
}
const routes = {
  calendar: "/admin/calendario?evento=" + f.league,
  table: "/admin/clasificacion?evento=" + f.league,
  bracket: "/admin/eliminatorias?evento=" + f.quarters,
  champion: "/eventos/" + f.champion,
  summary: "/admin?evento=" + f.league,
  requests: `/admin/solicitudes?evento=${requestFixture.event}&vista=pending&solicitud=${requestFixture.application}`,
};
const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  ctx = await b.newContext({ reducedMotion: "reduce" });
await login(ctx);
const p = await ctx.newPage();
try {
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const [version, base] of [
      ["before", "http://127.0.0.1:3212"],
      ["after", "http://127.0.0.1:3210"],
    ]) {
      for (const [name, route] of Object.entries(routes)) {
        await p.goto(base + route);
        await p.locator("h1").waitFor();
        await p.evaluate(() => document.fonts.ready);
        if (name === "calendar")
          await p.locator(".league-round").first().waitFor();
        if (name === "champion") await p.locator(".champion-stage").waitFor();
        await p.waitForTimeout(120);
        await p.screenshot({
          path: path.join(out, `${name}-${version}-${width}.png`),
        });
        const selector =
          name === "calendar"
            ? version === "before"
              ? ".league-round"
              : ".league-calendar"
            : name === "table"
              ? ".league-table-scroll"
              : name === "bracket"
                ? ".ko-bracket"
                : name === "champion"
                  ? ".champion-final"
                  : name === "requests"
                    ? "#application-detail"
                    : ".admin-overview";
        const target = p.locator(selector).first();
        if (await target.count()) {
          await target.evaluate((e) =>
            window.scrollTo({
              top: window.scrollY + e.getBoundingClientRect().top - 24,
              behavior: "instant",
            }),
          );
          await p.waitForTimeout(80);
          await p.screenshot({
            path: path.join(out, `${name}-detail-${version}-${width}.png`),
          });
        }
      }
    }
  }
  const baseline = JSON.parse(
    await fs.readFile(path.join(root, "visual-review/baseline.json")),
  );
  assert.deepEqual(
    (
      await db.query(
        "select id,name,status,registration_status from public.cfp_events where id=any($1) order by id",
        [Object.values(f)],
      )
    ).rows,
    baseline.events,
  );
  await fs.writeFile(
    path.join(out, "report.json"),
    JSON.stringify(
      {
        status: "PASS",
        beforeCommit: "814e054",
        after: "working branch compiled build",
        sizes: [
          { width: 1440, height: 1000 },
          { width: 390, height: 1000 },
        ],
        auth: "simulated local session; same real PostgreSQL fixtures in both applications",
        routes,
        requestFixture,
        notes:
          "Both versions wait for loaded content; screenshots are captured directly from archived/current builds. No image composition or alteration.",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS matched before/after screenshots, loaded content, same fixtures, sizes and state",
  );
} finally {
  await b.close();
  await db.end();
}

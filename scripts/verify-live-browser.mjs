import { Client, cfg } from "./knockout-fixture.mjs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const dir = process.env.CFP_TEST_DIR,
  f = JSON.parse(
    await fs.readFile(path.join(dir, "live-fixture.json"), "utf8"),
  ),
  { login } = await import(
    pathToFileURL(path.join(dir, "auth-design.mjs")).href
  ),
  out = path.join(dir, "live-review");
await fs.mkdir(out, { recursive: true });
const c = new Client(cfg);
await c.connect();
const b = await chromium.launch({
    executablePath:
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  }),
  owner = await b.newContext({ viewport: { width: 1440, height: 1000 } }),
  helper = await b.newContext({ viewport: { width: 390, height: 1000 } }),
  pub = await b.newContext({
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true,
  });
await login(owner);
await login(helper, f.helper);
const p = await owner.newPage(),
  h = await helper.newPage(),
  v = await pub.newPage(),
  base = "http://127.0.0.1:3210",
  errors = [],
  steps = [];
for (const page of [p, h, v])
  page.on("pageerror", (e) => errors.push(e.message));
const log = (s) => {
  steps.push(s);
  console.log("PASS", s);
};
async function post(page, button) {
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().startsWith(base),
    ),
    button.click(),
  ]);
}
const read = async () => {
  await c.query("begin;set local role authenticated");
  await c.query(
    "select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true)",
  );
  const d = (await c.query("select public.cfp_live_read($1) d", [f.league]))
    .rows[0].d;
  await c.query("commit");
  return d;
};
try {
  await p.goto(base + "/admin/live?evento=" + f.league);
  await p
    .getByRole("heading", { name: "Marcador de trabajo", exact: true })
    .waitFor();
  await h.goto(base + "/live?evento=" + f.league);
  await h
    .getByText(
      "Ayudante de este evento · solo puedes editar el marcador de trabajo.",
    )
    .waitFor();
  assert.equal(
    await h
      .getByRole("button", {
        name: "Convocar e iniciar espera de 5:00",
        exact: true,
      })
      .count(),
    0,
  );
  assert.equal(
    await h
      .getByRole("heading", { name: "Ayudantes del evento", exact: true })
      .count(),
    0,
  );
  let doc = await read();
  const selected = await h.locator("#live-match").inputValue();
  let m = doc.matches.find((x) => x.id === selected);
  for (let n = 1; n <= 4; n++) {
    await post(
      h,
      h.getByRole("button", {
        name: "Añadir gol a " + m.home_name,
        exact: true,
      }),
    );
    await h.waitForFunction(
      (n) =>
        document.querySelector(".live-score-team strong")?.textContent ===
        String(n),
      n,
    );
  }
  await h.getByText(/Ventaja de cuatro goles/).waitFor();
  assert.equal(
    (await read()).matches.find((x) => x.id === m.id).kind,
    "pending",
  );
  log(
    "helper changes four working goals through Next actions; no owner controls or automatic official result",
  );
  await p
    .getByRole("button", { name: "Actualizar lectura", exact: true })
    .click();
  await p.waitForFunction(
    () =>
      document.querySelector(".live-score-team strong")?.textContent === "4",
  );
  await p
    .locator("#live-official-reason")
    .fill("Partido deportivo comprobado en ensayo");
  await p.getByLabel("He comprobado el desenlace", { exact: false }).check();
  await post(
    p,
    p.getByRole("button", {
      name: "Confirmar resultado deportivo oficial",
      exact: true,
    }),
  );
  await p
    .getByRole("heading", { name: "Resultado oficial", exact: true })
    .waitFor();
  assert.equal((await read()).matches.find((x) => x.id === m.id).kind, "sport");
  log(
    "owner separately confirms sporting result via existing official phase operation",
  );
  const second = (await read()).matches.find(
    (x) => x.id !== m.id && x.home && x.away && x.kind === "pending",
  );
  await p.locator("#live-match").selectOption(second.id);
  await p
    .getByLabel("He convocado este partido con la sala disponible.", {
      exact: true,
    })
    .check();
  await post(
    p,
    p.getByRole("button", {
      name: "Convocar e iniciar espera de 5:00",
      exact: true,
    }),
  );
  await p
    .locator(".live-wait-clock")
    .filter({ hasText: /05:00|04:59/ })
    .waitFor();
  await c.query(
    "update cfp_private.live_working set called_at=now()-interval '6 minutes' where event_id=$1 and match_id=$2",
    [f.league, second.id],
  );
  await p
    .getByRole("button", { name: "Actualizar lectura", exact: true })
    .click();
  await p.locator(".live-wait-clock").filter({ hasText: "00:00" }).waitFor();
  await p.locator("#live-resolution").selectOption("absence");
  await p.locator("#live-absent").selectOption(second.away);
  await p
    .locator("#live-official-reason")
    .fill("Ausencia confirmada con reloj aislado");
  await p.getByLabel("He comprobado el desenlace", { exact: false }).check();
  await post(
    p,
    p.getByRole("button", {
      name: "Confirmar ausencia y guardar 3–0",
      exact: true,
    }),
  );
  await p
    .getByRole("heading", { name: "Resultado oficial", exact: true })
    .waitFor();
  let resolved = (await read()).matches.find((x) => x.id === second.id);
  assert.equal(resolved.kind, "absence_away");
  assert.equal(resolved.hg, 3);
  assert.equal(resolved.ag, 0);
  log(
    "explicit call, visible wait clock, test-only clock shift, selected absence3-0",
  );
  const clip = "https://example.com/private-clip-" + Date.now();
  await p.locator("#evidence-url").fill(clip);
  await p.locator("#evidence-reason").fill("Clip de prueba mantenido privado");
  await post(
    p,
    p.getByRole("button", {
      name: "Guardar enlace y visibilidad",
      exact: true,
    }),
  );
  await v.goto(base + `/eventos/${f.league}/partidos/${second.id}`);
  assert.equal(
    await v
      .getByRole("link", {
        name: "Ver clip de evidencia publicado por el organizador",
      })
      .count(),
    0,
  );
  await p
    .getByLabel("Publicar el enlace en la página del partido", { exact: true })
    .check();
  await p
    .locator("#evidence-reason")
    .fill("Publicación expresa de clip del ensayo");
  await post(
    p,
    p.getByRole("button", {
      name: "Guardar enlace y visibilidad",
      exact: true,
    }),
  );
  await v.reload();
  assert.equal(
    await v
      .getByRole("link", {
        name: "Ver clip de evidencia publicado por el organizador",
      })
      .getAttribute("href"),
    clip,
  );
  log(
    "private evidence excluded; explicit publication exposes only the chosen HTTPS link",
  );
  for (const width of [1440, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base + "/admin/live?evento=" + f.league);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForFunction(
      () => document.documentElement.scrollWidth <= window.innerWidth,
      null,
      { timeout: 5000 },
    );
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
    await p.screenshot({ path: out + `/owner-${width}.png` });
    await p
      .locator(".live-score-grid")
      .screenshot({ path: out + `/score-${width}.png` });
  }
  await h.addScriptTag({
    path: path.resolve("node_modules/axe-core/axe.min.js"),
  });
  assert.deepEqual(
    await h.evaluate(async () => (await window.axe.run()).violations),
    [],
  );
  assert.equal(
    await h.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await h.screenshot({ path: out + "/helper-390.png" });
  log("owner1440/390 and helper mobile; Axe and no overflow");
  for (const view of ["marcador", "clasificacion", "cuadro"]) {
    const event = view === "cuadro" ? f.knockout : f.league,
      url = `/obs/${event}/${view}${view === "marcador" ? "?partido=" + m.id : ""}`;
    await v.goto(base + url);
    await v.locator(".obs-canvas").waitFor();
    assert.equal(await v.locator(".site-header").count(), 0);
    await v.addScriptTag({
      path: path.resolve("node_modules/axe-core/axe.min.js"),
    });
    assert.deepEqual(
      await v.evaluate(async () => (await window.axe.run()).violations),
      [],
    );
    await v.screenshot({ path: out + `/obs-${view}.png` });
    const response = await pub.request.get(
      base + url.replace("/obs/", "/api/obs/"),
    );
    assert.equal(response.status(), 200);
    const text = await response.text();
    assert.ok(
      !text.includes(f.email) &&
        !text.includes(f.helper) &&
        !text.includes("PRIVATE_") &&
        !text.includes("source_key"),
    );
  }
  log("three real public OBS views, only public data, clean frame and Axe");
  await v.goto(base + `/eventos/${f.league}/exportar`);
  await v
    .getByRole("heading", { name: "Exportar la edición", exact: true })
    .waitFor();
  const take = async (name, label) => {
    const pending = v.waitForEvent("download", { timeout: 60000 });
    await v.getByRole("button", { name: label, exact: true }).click();
    const download = await pending;
    await download.saveAs(path.join(out, name));
    assert.equal(await download.failure(), null);
  };
  await take("classification.csv", "Descargar CSV completo");
  const csv = await fs.readFile(path.join(out, "classification.csv"), "utf8");
  assert.ok(csv.includes("\"'=HYPERLINK"));
  await take("classification.png", "Descargar imagen de esta página");
  const png = await fs.readFile(path.join(out, "classification.png"));
  assert.equal(png.readUInt32BE(16), 2560);
  await take("classification.pdf", "Descargar PDF completo");
  const pdf = await fs.readFile(path.join(out, "classification.pdf"));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  await v.locator("#export-view").selectOption("results");
  await take("results.csv", "Descargar CSV completo");
  assert.ok(
    (await fs.readFile(path.join(out, "results.csv"), "utf8")).includes(
      "Ausencia visitante",
    ),
  );
  log(
    "real PNG/PDF/CSV downloads, multipage classification and formula escaping",
  );
  const before = (
    await c.query(
      "select seed,teams from cfp_private.leagues where event_id=$1",
      [f.league],
    )
  ).rows[0];
  let posts = 0;
  v.on("request", (r) => {
    if (r.method() === "POST") posts++;
  });
  await v.goto(base + `/eventos/${f.league}/revelacion`);
  await v.emulateMedia({ reducedMotion: "reduce" });
  await v
    .getByRole("button", { name: "Reproducir revelación guardada" })
    .click();
  assert.equal(await v.locator(".draw-reveal-list li").count(), 24);
  await v.emulateMedia({ reducedMotion: "no-preference" });
  await v
    .getByRole("button", { name: "Reproducir revelación guardada" })
    .click();
  await v.waitForFunction(
    () => document.querySelectorAll(".draw-reveal-list li").length === 24,
  );
  assert.equal(posts, 0);
  assert.deepEqual(
    (
      await c.query(
        "select seed,teams from cfp_private.leagues where event_id=$1",
        [f.league],
      )
    ).rows[0],
    before,
  );
  log(
    "reveal uses saved24matches, reduced motion and animated replay; no POST or new draw",
  );
  await p.locator("#helper-reason").fill("Revocación del permiso en ensayo");
  await post(
    p,
    p.getByRole("button", { name: "Revocar permiso", exact: true }),
  );
  const denied = await helper.request.get(base + "/api/live/" + f.league);
  assert.equal(denied.status(), 403);
  await h
    .getByRole("heading", { name: "Acceso no disponible", exact: true })
    .waitFor({ timeout: 15000 });
  await h.goto(base + "/admin");
  await h.waitForURL("**/admin/acceso?estado=sin-permiso");
  const anon = await pub.request.get(base + "/api/live/" + f.league);
  assert.equal(anon.status(), 401);
  log("helper revocation observed, admin denied and live API requires session");
  assert.deepEqual(errors, []);
  await fs.writeFile(
    out + "/report.json",
    JSON.stringify(
      {
        status: "PASS",
        auth: "local Auth/REST stub; real PostgreSQL, Next server actions and downloaded files",
        events: { league: f.league, knockout: f.knockout },
        steps,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.log(
    "FAILURE LAYOUT",
    await p.evaluate(() => ({
      url: window.location.href,
      inner: window.innerWidth,
      scroll: document.documentElement.scrollWidth,
      items: [...document.querySelectorAll("body *")]
        .map((x) => ({
          tag: x.tagName,
          cls: x.className,
          w: x.getBoundingClientRect().width,
          right: x.getBoundingClientRect().right,
          text: x.textContent.slice(0, 120),
        }))
        .filter((x) => x.right > window.innerWidth)
        .sort((a, b) => b.w - a.w)
        .slice(0, 10),
    })),
  );
  await p.screenshot({ path: out + "/failure.png", fullPage: true });
  throw error;
} finally {
  await c.query("rollback");
  await c.end();
  await b.close();
}

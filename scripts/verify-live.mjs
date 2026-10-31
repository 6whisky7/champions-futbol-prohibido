import { Client, cfg, fixture, owner, rejects } from "./knockout-fixture.mjs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const c = new Client(cfg);
await c.connect();
const helper = crypto.randomUUID(),
  email = "helper-" + helper + "@example.invalid";
async function asHelper() {
  await c.query("set local role authenticated");
  await c.query("select set_config('request.jwt.claim.sub',$1,true)", [helper]);
}
async function read(e) {
  return (await c.query("select public.cfp_live_read($1) d", [e])).rows[0].d;
}
async function save(e, mid, action, p, expected) {
  return c.query("select public.cfp_live_save($1,$2,$3,$4,$5)", [
    e,
    mid,
    action,
    { reason: "Operación controlada de prueba", ...p },
    expected,
  ]);
}
async function official(e, m, kind, absent = null) {
  return c.query("select public.cfp_live_official($1,$2,$3,$4,$5,$6,$7)", [
    e,
    m.id,
    kind,
    absent,
    m.official_revision,
    m.working?.revision ?? 0,
    "Decisión oficial aislada",
  ]);
}
try {
  await c.query("begin");
  await c.query(
    "insert into auth.users(id,email,email_confirmed_at,is_anonymous) values($1,$2,now(),false)",
    [helper, email],
  );
  const e = await fixture(c);
  await c.query("delete from cfp_private.leagues where event_id=$1", [e]);
  await owner(c);
  await c.query("select public.cfp_league_preview($1)", [e]);
  await c.query(
    `select public.cfp_league_action($1,'confirm','{"reason":"Fixture LIVE"}',0)`,
    [e],
  );
  const other = await (async () => {
    await c.query("reset role");
    const id = await fixture(c);
    await owner(c);
    return id;
  })();
  await c.query("select public.cfp_live_helper($1,$2,true,$3)", [
    e,
    email,
    "Ayudante aislado expresamente asignado",
  ]);
  await asHelper();
  let doc = await read(e);
  assert.equal(doc.role, "helper");
  assert.equal(doc.matches.length, 16);
  const ids = doc.matches.map((m) => m.id),
    id = ids[0];
  assert.ok(
    !JSON.stringify(doc).match(
      /tiktok|PRIVATE_|member_checks|source_key|history|actor|email/,
    ),
  );
  await rejects(c, () => read(other), /no asignado/);
  await save(e, id, "score", { hg: 2, ag: 0 }, 0);
  doc = await read(e);
  let m = doc.matches.find((m) => m.id === id);
  assert.equal(m.working.hg, 2);
  assert.equal(m.kind, "pending");
  await rejects(
    c,
    () => save(e, id, "score", { hg: 3, ag: 0 }, 0),
    /Otro operador/,
  );
  await rejects(
    c,
    () => save(e, id, "score", { hg: -1, ag: 0 }, m.working.revision),
    /enteros/,
  );
  await rejects(
    c,
    () => save(e, id, "score", { hg: 1.5, ag: 0 }, m.working.revision),
    /enteros/,
  );
  await rejects(
    c,
    () => save(e, id, "call", { room_ready: true }, m.working.revision),
    /solo puede/,
  );
  await rejects(
    c,
    () => save(e, id, "reset", {}, m.working.revision),
    /solo puede/,
  );
  await rejects(c, () => official(e, m, "sport"), /denegado/);
  await rejects(
    c,
    () => c.query("select public.cfp_live_admin($1)", [e]),
    /denegado/,
  );
  await rejects(
    c,
    () => c.query("select public.cfp_admin_applications($1)", [e]),
    /denegado/,
  );
  await rejects(
    c,
    () =>
      c.query("select public.cfp_live_helper($1,$2,true,$3)", [
        other,
        email,
        "No permitido",
      ]),
    /denegado/,
  );
  await rejects(
    c,
    () =>
      c.query("select public.cfp_live_evidence($1,$2,$3,false,$4)", [
        e,
        id,
        "https://example.com/clip",
        "No permitido",
      ]),
    /denegado/,
  );
  await rejects(
    c,
    () =>
      c.query(
        `select public.cfp_league_action($1,'close','{"reason":"No permitido"}',0)`,
        [e],
      ),
    /denegado/,
  );
  for (const table of [
    "event_helpers",
    "live_working",
    "live_history",
    "match_evidence",
  ])
    await rejects(
      c,
      () => c.query("select * from cfp_private." + table),
      /permission denied/,
    );
  console.log(
    "PASS helper score-only scope, cross-event/owner/private-table denial, stale revision and valid integers; no official save",
  );
  await owner(c);
  await rejects(
    c,
    () => save(e, id, "call", { room_ready: false }, m.working.revision),
    /sala disponible/,
  );
  await save(e, id, "call", { room_ready: true }, m.working.revision);
  m = (await read(e)).matches.find((x) => x.id === id);
  assert.ok(m.working.called_at);
  await rejects(c, () => official(e, m, "absence", m.home), /cinco minutos/);
  await c.query("reset role");
  await c.query(
    "update cfp_private.live_working set called_at=now()-interval '6 minutes' where event_id=$1 and match_id=$2",
    [e, id],
  );
  await owner(c);
  await rejects(
    c,
    () => official(e, m, "absence", crypto.randomUUID()),
    /equipo ausente/,
  );
  await official(e, m, "absence", m.home);
  m = (await read(e)).matches.find((x) => x.id === id);
  assert.equal(m.kind, "absence_home");
  assert.equal(m.hg, 0);
  assert.equal(m.ag, 3);
  assert.equal(m.working.called_at, null);
  assert.equal(m.working.needs_reset, true);
  await asHelper();
  await rejects(
    c,
    () => save(e, id, "score", { hg: 1, ag: 1 }, m.working.revision),
    /no admite/,
  );
  console.log(
    "PASS explicit room call, DB five-minute guard, controlled test clock only, selected absence official3-0 and working invalidation",
  );
  const sport = ids[1];
  await save(e, sport, "score", { hg: 4, ag: 0 }, 0);
  m = (await read(e)).matches.find((x) => x.id === sport);
  assert.equal(m.kind, "pending");
  await owner(c);
  await official(e, m, "sport");
  m = (await read(e)).matches.find((x) => x.id === sport);
  assert.equal(m.kind, "sport");
  assert.equal(m.hg, 4);
  console.log(
    "PASS four-goal working score never auto-finalizes; owner official confirmation reuses original result action",
  );
  const changed = ids[2];
  await save(e, changed, "call", { room_ready: true }, 0);
  m = (await read(e)).matches.find((x) => x.id === changed);
  await c.query("select public.cfp_league_action($1,'match',$2,$3)", [
    e,
    {
      id: changed,
      kind: "postponed",
      scheduled_at: "2030-01-01T02:00:00Z",
      reason: "Reprogramación aislada",
    },
    m.official_revision,
  ]);
  m = (await read(e)).matches.find((x) => x.id === changed);
  assert.equal(m.working.needs_reset, true);
  assert.equal(m.working.called_at, null);
  await asHelper();
  await rejects(
    c,
    () => save(e, changed, "score", { hg: 1, ag: 0 }, m.working.revision),
    /preparar este intento/,
  );
  await owner(c);
  await save(e, changed, "reset", {}, m.working.revision);
  assert.equal(
    (await read(e)).matches.find((x) => x.id === changed).working.needs_reset,
    false,
  );
  console.log(
    "PASS reprogramming invalidates the call and helper must wait for owner preparation",
  );
  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "https://user:pass@example.com/",
    "https://example.com@evil.test/",
    "https://example.com\nx",
  ])
    await rejects(
      c,
      () =>
        c.query("select public.cfp_live_evidence($1,$2,$3,false,$4)", [
          e,
          id,
          url,
          "Prueba de enlace",
        ]),
      /HTTPS/,
    );
  await c.query("select public.cfp_live_evidence($1,$2,$3,false,$4)", [
    e,
    id,
    "https://example.com/clip",
    "Clip privado aislado",
  ]);
  assert.equal(
    (await c.query("select public.cfp_public_evidence($1) d", [e])).rows[0].d
      .length,
    0,
  );
  await c.query("select public.cfp_live_evidence($1,$2,$3,true,$4)", [
    e,
    id,
    "https://example.com/clip",
    "Publicación explícita del clip",
  ]);
  assert.equal(
    (await c.query("select public.cfp_public_evidence($1) d", [e])).rows[0].d[0]
      .url,
    "https://example.com/clip",
  );
  const admin = (await c.query("select public.cfp_live_admin($1) d", [e]))
    .rows[0].d;
  assert.ok(admin.history.some((h) => h.actor === helper));
  assert.ok(admin.history.some((h) => h.action === "official_absence"));
  await c.query("select public.cfp_live_helper($1,$2,false,$3)", [
    e,
    email,
    "Revocación aislada",
  ]);
  await asHelper();
  await rejects(c, () => read(e), /revocado/);
  await rejects(
    c,
    () => save(e, changed, "score", { hg: 1, ag: 0 }, 2),
    /revocado/,
  );
  assert.deepEqual(
    (await c.query("select public.cfp_my_live_events() d")).rows[0].d,
    [],
  );
  await c.query("reset role");
  await c.query("update public.cfp_events set status='draft' where id=$1", [e]);
  await c.query("set local role anon");
  assert.equal(
    (await c.query("select public.cfp_live_public($1) d", [e])).rows[0].d,
    null,
  );
  assert.deepEqual(
    (await c.query("select public.cfp_public_evidence($1) d", [e])).rows[0].d,
    [],
  );
  await rejects(
    c,
    () => save(e, changed, "score", { hg: 1, ag: 0 }, 2),
    /permission denied/,
  );
  console.log(
    "PASS HTTPS validation, explicit evidence visibility, actor audit, immediate revocation and draft/anonymous protection; all rolled back",
  );
  await c.query("reset role");
  const ko = await fixture(c);
  await owner(c);
  await c.query("select public.cfp_knockout_preview($1)", [ko]);
  let kd = (await c.query("select public.cfp_knockout_read($1,true) d", [ko]))
    .rows[0].d;
  await c.query("select public.cfp_knockout_action($1,'confirm',$2,$3)", [
    ko,
    { reason: "Cuadro de prueba LIVE" },
    kd.revision,
  ]);
  await c.query("select public.cfp_live_helper($1,$2,true,$3)", [
    ko,
    email,
    "Permiso de prueba KO",
  ]);
  await asHelper();
  let km = (await read(ko)).matches.find(
    (x) => x.home && x.away && x.kind === "pending",
  );
  await save(ko, km.id, "score", { hg: 4, ag: 0 }, 0);
  km = (await read(ko)).matches.find((x) => x.id === km.id);
  await owner(c);
  await official(ko, km, "sport");
  assert.equal(
    (await read(ko)).matches.find((x) => x.id === km.id).kind,
    "sport",
  );
  km = (await read(ko)).matches.find(
    (x) => x.home && x.away && x.kind === "pending",
  );
  await save(ko, km.id, "call", { room_ready: true }, 0);
  km = (await read(ko)).matches.find((x) => x.id === km.id);
  await c.query(
    "select public.cfp_knockout_action($1,'double_absence',$2,$3)",
    [
      ko,
      { id: km.id, reason: "Doble ausencia del primer intento de prueba" },
      km.official_revision,
    ],
  );
  km = (await read(ko)).matches.find((x) => x.id === km.id);
  assert.equal(km.attempt, 2);
  assert.equal(km.working.needs_reset, true);
  assert.equal(km.working.called_at, null);
  await asHelper();
  await rejects(
    c,
    () => save(ko, km.id, "score", { hg: 1, ag: 0 }, km.working.revision),
    /preparar este intento/,
  );
  await owner(c);
  await save(ko, km.id, "call", { room_ready: true }, km.working.revision);
  km = (await read(ko)).matches.find((x) => x.id === km.id);
  await rejects(c, () => official(ko, km, "absence", km.away), /cinco minutos/);
  await c.query("reset role");
  await c.query("update auth.users set email_confirmed_at=null where id=$1", [
    helper,
  ]);
  await asHelper();
  await rejects(c, () => read(ko), /no asignado/);
  await owner(c);
  await c.query("select public.cfp_live_helper($1,$2,false,$3)", [
    ko,
    email,
    "Revocar aunque la cuenta ya no esté verificada",
  ]);
  await c.query("reset role");
  await c.query("update auth.users set email_confirmed_at=now() where id=$1", [
    helper,
  ]);
  await asHelper();
  await rejects(c, () => read(ko), /revocado/);
  await owner(c);
  await c.query("select public.cfp_live_helper($1,$2,true,$3)", [
    ko,
    email,
    "Nueva asignación explícita de prueba",
  ]);
  await c.query("reset role");
  await c.query(
    "update auth.users set email_confirmed_at=now(),is_anonymous=true where id=$1",
    [helper],
  );
  await asHelper();
  await rejects(c, () => read(ko), /no asignado/);
  await c.query("reset role");
  console.log(
    "PASS KO official wrapper, second-attempt timer invalidation, verified/non-anonymous helper guard",
  );
  await c.query("rollback");
} finally {
  await c.query("rollback");
  await c.end();
}

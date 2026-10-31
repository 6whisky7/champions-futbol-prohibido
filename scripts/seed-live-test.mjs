// Committed fixtures for local browser rehearsal only. The helper never exists in production.
import { Client, cfg, fixture, owner } from "./knockout-fixture.mjs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
const c = new Client(cfg);
await c.connect();
const helper = crypto.randomUUID(),
  email = "helper-" + helper + "@example.invalid";
try {
  await c.query("begin");
  await c.query(
    "insert into auth.users(id,email,email_confirmed_at,is_anonymous) values($1,$2,now(),false)",
    [helper, email],
  );
  const league = await fixture(c, "quarters", 12);
  await c.query("delete from cfp_private.leagues where event_id=$1", [league]);
  await c.query(
    "update public.cfp_events set name='LIVE · prueba aislada' where id=$1",
    [league],
  );
  await c.query(
    "update cfp_private.applications set payload=jsonb_set(payload,'{name}',to_jsonb($2::text)) where id=(select id from cfp_private.applications where event_id=$1 order by id limit 1)",
    [league, '=HYPERLINK("https://example.com","Equipo de prueba")'],
  );
  await owner(c);
  await c.query("select public.cfp_league_preview($1)", [league]);
  await c.query(
    `select public.cfp_league_action($1,'confirm','{"reason":"Ensayo LIVE aislado"}',0)`,
    [league],
  );
  await c.query("select public.cfp_live_helper($1,$2,true,$3)", [
    league,
    email,
    "Asignación de prueba local",
  ]);
  await c.query("reset role");
  const knockout = await fixture(c);
  await c.query(
    "update public.cfp_events set name='Cuadro LIVE · prueba aislada' where id=$1",
    [knockout],
  );
  await owner(c);
  await c.query("select public.cfp_knockout_preview($1)", [knockout]);
  const k = (
    await c.query("select public.cfp_knockout_read($1,true) d", [knockout])
  ).rows[0].d;
  await c.query(
    `select public.cfp_knockout_action($1,'confirm','{"reason":"Ensayo de cuadro aislado"}',$2)`,
    [knockout, k.revision],
  );
  await c.query("select public.cfp_live_helper($1,$2,true,$3)", [
    knockout,
    email,
    "Asignación de prueba local",
  ]);
  await c.query("commit");
  await fs.writeFile(
    path.join(process.env.CFP_TEST_DIR, "live-fixture.json"),
    JSON.stringify({ league, knockout, helper, email }),
  );
  console.log(
    "PASS isolated LIVE/KO fixtures and helper prepared; no real Auth account or email sent",
  );
} finally {
  await c.query("rollback");
  await c.end();
}

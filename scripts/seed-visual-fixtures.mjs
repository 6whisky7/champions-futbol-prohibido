import { Client, cfg, fixture, owner, act, read } from "./knockout-fixture.mjs";
import fs from "node:fs/promises";
import path from "node:path";
const c = new Client(cfg);
await c.connect();
const result = {};
try {
  await c.query("begin");
  const league = await fixture(c, "quarters", 12);
  await c.query("delete from cfp_private.leagues where event_id=$1", [league]);
  await c.query(
    "update public.cfp_events set name='Visual · Liga de doce equipos',description='Datos ficticios para comparar presentación; no es un evento real.' where id=$1",
    [league],
  );
  await owner(c);
  await c.query("select public.cfp_league_preview($1)", [league]);
  await c.query("select public.cfp_league_action($1,'confirm',$2,0)", [
    league,
    { reason: "Confirmación del fixture visual aislado" },
  ]);
  const l = () =>
    c
      .query("select public.cfp_league_read($1,true) d", [league])
      .then((r) => r.rows[0].d);
  for (let i = 0; i < 4; i++) {
    const d = await l(),
      m = d.matches[i];
    await c.query("select public.cfp_league_action($1,'match',$2,$3)", [
      league,
      {
        id: m.id,
        kind: ["sport", "null", "absence_home", "postponed"][i],
        hg: 5,
        ag: 2,
        scheduled_at: i === 3 ? "2027-02-01T02:15:00Z" : null,
        reason: "Resultado y horario del ensayo visual",
      },
      d.revision,
    ]);
  }
  await c.query("reset role");
  result.league = league;
  for (const [format, n] of [
    ["quarters", 8],
    ["round16", 16],
    ["round32", 32],
    ["repechage", 24],
  ]) {
    // Persisted closed-league fixture from the existing isolated KO test factory.
    const realFormat = format;
    const e = await fixture(c, realFormat, n);
    await c.query("update public.cfp_events set name=$2 where id=$1", [
      e,
      "Visual · " + format,
    ]);
    await owner(c);
    await c.query("select public.cfp_knockout_preview($1)", [e]);
    await act(c, e, "confirm");
    await c.query("reset role");
    result[format] = e;
  }
  const champ = await fixture(c);
  await c.query(
    "update public.cfp_events set name='Visual · Campeón administrativo' where id=$1",
    [champ],
  );
  await owner(c);
  await c.query("select public.cfp_knockout_preview($1)", [champ]);
  await act(c, champ, "confirm");
  for (let i = 1; i <= 6; i++) {
    const k = await read(c, champ),
      m = k.matches.find((m) => m.number === i);
    await act(c, champ, "match", { id: m.id, kind: "sport", hg: 5, ag: 2 });
  }
  const k = await read(c, champ),
    m = k.matches.find((m) => m.number === 7);
  await act(c, champ, "double_absence", { id: m.id });
  await act(c, champ, "double_absence", { id: m.id });
  await act(c, champ, "close");
  await c.query("reset role");
  result.champion = champ;
  await c.query("commit");
  await fs.mkdir(path.join(process.env.CFP_TEST_DIR, "visual-review"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(process.env.CFP_TEST_DIR, "visual-review/fixtures.json"),
    JSON.stringify(result, null, 2),
  );
  console.log("PASS local visual fixtures created", result);
} catch (e) {
  await c.query("rollback");
  throw e;
} finally {
  await c.end();
}

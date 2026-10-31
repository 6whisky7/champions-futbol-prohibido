import { Client, cfg, owner } from "./knockout-fixture.mjs";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
const f = JSON.parse(
    await fs.readFile(
      path.join(process.env.CFP_TEST_DIR, "live-fixture.json"),
      "utf8",
    ),
  ),
  c = new Client(cfg);
await c.connect();
let mid;
try {
  const row = (
    await c.query(
      "select m from jsonb_array_elements(cfp_private.live_matches($1))m where m->>'home' is not null and m->>'away' is not null and m->>'kind'='pending' and not exists(select 1 from cfp_private.live_working w where w.event_id=$1 and w.match_id=(m->>'id')::uuid) limit 1",
      [f.knockout],
    )
  ).rows[0];
  assert.ok(row, "Seed a fresh isolated LIVE fixture first");
  mid = row.m.id;
  const before = (
    await c.query(
      "select to_jsonb(m) d from cfp_private.knockout_matches m where event_id=$1 and id=$2",
      [f.knockout, mid],
    )
  ).rows[0].d;
  const result = await Promise.allSettled(
    [0, 1].map(async (i) => {
      const d = new Client(cfg);
      await d.connect();
      try {
        await d.query("begin");
        if (i === 0) await owner(d);
        else {
          await d.query("set local role authenticated");
          await d.query("select set_config('request.jwt.claim.sub',$1,true)", [
            f.helper,
          ]);
        }
        await d.query("select public.cfp_live_save($1,$2,'score',$3,0)", [
          f.knockout,
          mid,
          {
            hg: i + 1,
            ag: 0,
            reason: "Carrera aislada entre propietario y ayudante",
          },
        ]);
        await d.query("commit");
      } finally {
        await d.query("rollback");
        await d.end();
      }
    }),
  );
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.match(
    result.find((x) => x.status === "rejected").reason.message,
    /Otro operador/,
  );
  const w = (
    await c.query(
      "select revision,hg,ag from cfp_private.live_working where event_id=$1 and match_id=$2",
      [f.knockout, mid],
    )
  ).rows[0];
  assert.equal(w.revision, 1);
  assert.ok([1, 2].includes(w.hg));
  assert.deepEqual(
    (
      await c.query(
        "select to_jsonb(m) d from cfp_private.knockout_matches m where event_id=$1 and id=$2",
        [f.knockout, mid],
      )
    ).rows[0].d,
    before,
  );
  console.log(
    "PASS simultaneous owner/helper score: one commit, one stale rejection, official record unchanged",
  );
} finally {
  if (mid) {
    await c.query(
      "delete from cfp_private.live_history where event_id=$1 and match_id=$2",
      [f.knockout, mid],
    );
    await c.query(
      "delete from cfp_private.live_working where event_id=$1 and match_id=$2",
      [f.knockout, mid],
    );
  }
  await c.end();
}

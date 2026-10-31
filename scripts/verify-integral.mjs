// Isolated UI rehearsal. Auth and transport helpers remain outside the app.
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const testDir = process.env.CFP_TEST_DIR;
assert.ok(testDir, 'CFP_TEST_DIR must point to the isolated local harness');
const { login } = await import(pathToFileURL(path.join(testDir, 'auth-design.mjs')).href);
const { Client } = createRequire(path.join(testDir, 'package.json'))('pg');
const cfg = JSON.parse(await fs.readFile(path.join(testDir, 'connection.json'), 'utf8'));
assert.equal(cfg.host, '127.0.0.1');
assert.equal(cfg.port, 55439);
const base = 'http://127.0.0.1:3210', tag = Date.now().toString(36), out = path.join(testDir, 'integral-' + tag);
await fs.mkdir(out, { recursive: true });
const report = { event: null, status: 'RUNNING', auth: 'simulated locally; real PostgreSQL roles/functions; test transport, not real Supabase Auth', steps: [], errors: [], out };
const log = async (s) => { report.steps.push(s); console.log('PASS', s); await fs.writeFile(out + '/report.json', JSON.stringify(report, null, 2)); };
const db = new Client(cfg);
await db.connect();
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await login(admin);
const pub = await browser.newContext({ viewport: { width: 390, height: 844 } });
const a = await admin.newPage(), p = await pub.newPage();
for (const pg of [a, p])
    pg.on('pageerror', e => report.errors.push(e.message));
let e;
async function post(page, button) { await page.waitForLoadState('networkidle'); const response = page.waitForResponse(r => r.request().method() === 'POST' && r.url().startsWith(base)); await Promise.all([button.click(), response]); await page.waitForTimeout(60); }
async function shot(page, name) { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForLoadState('networkidle'); await page.evaluate(() => { document.activeElement?.blur(); document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); }); await page.waitForTimeout(120); await page.screenshot({ path: out + '/' + name + '.png', fullPage: false }); }
const crew = (n, j) => ({ roblox: `a${tag}_${n}_${j}`, tiktok: `a${tag}.${n}.${j}` });
async function submit(name, crest, n, { four = false, waiting = false, reuse = null, error = false } = {}) { await p.goto(base + '/eventos/' + e); await p.locator('#team-name').fill(name); if (waiting)
    await p.getByRole('checkbox').filter({ visible: true }).last().check().catch(async () => p.getByLabel('Enviar a lista de espera', { exact: false }).check()); await p.locator('#crest').selectOption(String(crest).padStart(2, '0')); if (four)
    await p.getByRole('button', { name: 'Añadir suplente' }).click(); for (let j = 0; j < (four ? 4 : 3); j++) {
    const m = j === 1 && reuse ? reuse : crew(n, j);
    await p.locator('#roblox-' + j).fill(m.roblox);
    await p.locator('#tiktok-' + j).fill(m.tiktok);
} await p.getByRole('checkbox').first().check(); await p.getByRole('button', { name: 'Revisar datos' }).click(); await post(p, p.getByRole('button', { name: 'Enviar solicitud', exact: true })); if (error) {
    assert.equal(await p.locator('#team-name').inputValue(), name);
    await p.getByRole('alert').filter({ hasText: /No quedan plazas/ }).waitFor();
    return null;
} await p.getByRole('heading', { name: waiting ? 'Solicitud en lista de espera' : 'Solicitud recibida: pendiente de revisión', exact: true }).waitFor(); const id = (await p.getByRole('status').innerText()).match(/[0-9a-f]{8}-[0-9a-f-]{27}/i)[0]; return id; }
async function detail(id) { await a.goto(base + `/admin/solicitudes?evento=${e}&vista=&solicitud=${id}#application-detail`); await a.locator('#review-reason').fill('Revisión controlada ' + tag); }
async function decide(id, label) { await detail(id); await post(a, a.getByRole('button', { name: label, exact: true })); await a.reload(); }
try {
    await a.goto(base + '/admin/eventos/nuevo');
    await a.getByLabel('Nombre del evento', { exact: true }).fill('Ensayo integral ' + tag);
    await a.getByLabel('Inicio', { exact: true }).fill('2027-01-01T20:00');
    await a.locator('#capacity').fill('12');
    await a.locator('#eliminate_after_league').selectOption('no');
    await a.route(base + '/admin/eventos/nuevo', route => route.request().method() === 'POST' ? route.abort('failed') : route.continue());
    await a.getByRole('button', { name: 'Guardar evento' }).click();
    await a.getByRole('alert').filter({ hasText: 'Conservamos tus datos' }).waitFor();
    assert.equal(await a.locator('#name').inputValue(), 'Ensayo integral ' + tag);
    assert.equal(await a.locator('#starts_at').inputValue(), '2027-01-01T20:00');
    assert.equal(await a.locator('#eliminate_after_league').inputValue(), 'no');
    assert.equal(await a.locator('#capacity').inputValue(), '12');
    await a.unroute(base + '/admin/eventos/nuevo');
    await log('event network failure preserves all typed inputs before retry');
    await post(a, a.getByRole('button', { name: 'Guardar evento' }));
    await a.getByRole('alert').filter({ hasText: /deben continuar/ }).waitFor();
    assert.equal(await a.locator('#name').inputValue(), 'Ensayo integral ' + tag);
    assert.equal(await a.locator('#starts_at').inputValue(), '2027-01-01T20:00');
    assert.equal(await a.locator('#eliminate_after_league').inputValue(), 'no');
    assert.equal(await a.locator('#capacity').inputValue(), '12');
    await a.locator('#eliminate_after_league').selectOption('yes');
    await log('event server validation error preserves all typed inputs');
    await post(a, a.getByRole('button', { name: 'Guardar evento' }));
    await a.waitForURL(/guardado=1/);
    e = a.url().match(/eventos\/([0-9a-f-]{36})/)[1];
    report.event = e;
    await shot(a, '01-borrador');
    await a.locator('form.event-form').screenshot({ path: out + '/01-configuracion.png' });
    await a.locator('#status').selectOption('published');
    await post(a, a.getByRole('button', { name: 'Guardar evento' }));
    await a.reload();
    await a.locator('#registration_status').selectOption('open');
    await post(a, a.getByRole('button', { name: 'Guardar evento' }));
    await log('same event created as draft, published and opened through owner UI');
    const rejected = await submit('Halcones', '01', 99);
    await decide(rejected, 'Rechazar y liberar reservas');
    await log('public request rejected via owner UI');
    const expired = await submit('Aurora', '02', 98);
    await db.query("update cfp_private.applications set expires_at=now()-interval '1 second' where id=$1 and event_id=$2", [expired, e]);
    await log('only test clock/expiry shifted; no participant data inserted or edited directly');
    const names = ['Halcones', 'Aurora', 'Titanes', 'Centellas', 'Guerreros', 'Leyendas', 'Panteras', 'Toros', 'Estrellas', 'Rayos', 'Lobos', 'Fuerza Tica'], ids = [];
    for (let i = 1; i <= 11; i++) {
        ids.push(await submit(names[i - 1], i, i, { four: i % 3 === 0, reuse: i === 1 ? crew(99, 1) : i === 2 ? crew(98, 1) : null }));
        await log('public signup ' + i + ' saved; crest/name/player release respected');
    }
    await shot(p, '02-solicitud');
    const wait = await submit(names[11], 12, 12, { waiting: true, reuse: crew(3, 1), four: true });
    await detail(wait);
    await post(a, a.getByRole('button', { name: 'Promover y reservar plaza' }));
    await a.getByRole('status').filter({ hasText: /integrante/ }).waitFor();
    await log('waiting promotion refuses active player conflict');
    await detail(wait);
    await a.getByRole('button', { name: 'Corregir datos', exact: true }).click();
    await a.locator('#roblox-1').fill(crew(12, 1).roblox);
    await a.locator('#tiktok-1').fill(crew(12, 1).tiktok);
    await a.getByRole('button', { name: 'Revisar datos', exact: true }).click();
    await post(a, a.getByRole('button', { name: 'Guardar corrección', exact: true }));
    await a.reload();
    await decide(wait, 'Promover y reservar plaza');
    ids.push(wait);
    await log('waiting corrected via UI and promoted to pending; no re-entry of teams');
    await submit('Sin cupo', 13, 13, { error: true });
    await log('last seat enforced and typed data preserved on full capacity error');
    for (const id of ids.slice(0, 11)) {
        await decide(id, 'Confirmar capitán');
        await decide(id, 'Marcar requisitos revisados');
        await decide(id, 'Aprobar equipo');
    }
    await shot(a, '03-revision');
    await a.locator('#application-detail').screenshot({ path: out + '/03-detalle.png' });
    const before = (await db.query('select expires_at from cfp_private.applications where id=$1', [wait])).rows[0].expires_at;
    await a.goto(base + '/admin/eventos/' + e);
    await a.locator('#registration_status').selectOption('closed');
    await post(a, a.getByRole('button', { name: 'Guardar evento' }));
    assert.equal(String((await db.query('select expires_at from cfp_private.applications where id=$1', [wait])).rows[0].expires_at), String(before));
    await a.goto(base + '/admin/calendario?evento=' + e);
    assert.equal(await a.getByRole('button', { name: 'Generar revisión del calendario' }).isDisabled(), true);
    await log('closing preserves pending deadline and blocks draw until resolved');
    await decide(wait, 'Confirmar capitán');
    await decide(wait, 'Marcar requisitos revisados');
    await decide(wait, 'Aprobar equipo');
    await a.goto(base + '/admin/calendario?evento=' + e);
    await post(a, a.getByRole('button', { name: 'Generar revisión del calendario' }));
    await a.reload();
    await post(a, a.getByRole('button', { name: 'Confirmar y fijar calendario' }));
    await a.reload();
    await shot(a, '04-calendario');
    let matches = (await db.query('select * from cfp_private.league_matches where event_id=$1 order by round,game_order', [e])).rows;
    assert.equal(matches.length, 24);
    for (const m of matches) {
        await a.getByRole('button', { name: `Editar partido ${m.game_order} · jornada ${m.round}`, exact: true }).click();
        await a.locator('#match-state').selectOption('sport');
        await a.locator('#home-goals').fill('5');
        await a.locator('#away-goals').fill('2');
        await a.locator('#match-reason').fill('Resultado oficial de ensayo');
        if (m.id === matches[0].id)
            await a.locator('form.event-form').last().screenshot({ path: out + '/04-resultados.png' });
        await post(a, a.getByRole('button', { name: 'Guardar partido', exact: true }));
        await a.reload();
    }
    await log('24 league results entered through UI on the same approved teams');
    const first = matches[0];
    const beforeStats = (await db.query('select cfp_private.league_table($1) t', [e])).rows[0].t;
    await a.getByRole('button', { name: `Editar partido ${first.game_order} · jornada ${first.round}`, exact: true }).click();
    await a.locator('#match-state').selectOption('sport');
    await a.locator('#home-goals').fill('4');
    await a.locator('#away-goals').fill('2');
    await a.locator('#match-reason').fill('Corrección controlada de goles');
    await post(a, a.getByRole('button', { name: 'Guardar partido', exact: true }));
    await a.reload();
    const afterStats = (await db.query('select cfp_private.league_table($1) t', [e])).rows[0].t;
    assert.equal(afterStats.find(t => t.id === first.home).gf, beforeStats.find(t => t.id === first.home).gf - 1);
    assert.equal(afterStats.reduce((n, t) => n + t.pj, 0), 48);
    await log('corrected result recalculates GF without duplicate played matches or points');
    await a.goto(base + '/admin/clasificacion?evento=' + e);
    await a.getByRole('button', { name: 'Cerrar liguilla y conservar clasificación' }).waitFor();
    await a.waitForLoadState('networkidle');
    while (await a.getByRole('button', { name: /^Sortear:/ }).count()) {
        await post(a, a.getByRole('button', { name: /^Sortear:/ }).first());
        await a.reload();
        await a.waitForLoadState('networkidle');
    }
    await shot(a, '05-clasificacion');
    await post(a, a.getByRole('button', { name: 'Cerrar liguilla y conservar clasificación' }));
    await a.reload();
    assert.equal((await db.query('select state from cfp_private.leagues where event_id=$1', [e])).rows[0].state, 'closed');
    await log('final tie lots persisted and league table closed');
    await a.goto(base + '/admin/eliminatorias?evento=' + e);
    await post(a, a.getByRole('button', { name: 'Preparar revisión del cuadro' }));
    await a.reload();
    await post(a, a.getByRole('button', { name: 'Confirmar cuadro fijo' }));
    await a.reload();
    await shot(a, '06-cuadro');
    for (let i = 1; i <= 7; i++) {
        await a.getByRole('button', { name: 'Detalle del partido ' + i, exact: true }).click();
        await a.locator('#ko-hg').fill('5');
        await a.locator('#ko-ag').fill('2');
        await a.locator('#ko-reason').fill('Eliminatoria oficial de ensayo');
        await post(a, a.getByRole('button', { name: 'Guardar decisión del partido' }));
        await a.getByRole('status').filter({ hasText: 'Guardado.' }).waitFor();
        await a.reload();
    }
    await post(a, a.getByRole('button', { name: 'Confirmar campeón y terminar evento' }));
    await a.reload();
    await p.goto(base + '/eventos/' + e);
    await p.getByRole('heading', { name: 'Campeón', exact: true }).waitFor();
    assert.ok(!(await p.content()).includes(crew(1, 0).tiktok));
    await shot(p, '07-campeon');
    await p.locator('.champion-stage').screenshot({ path: out + '/07-campeon-completo.png' });
    const counts = (await db.query('select (select count(*) from cfp_private.league_matches where event_id=$1) league,(select count(*) from cfp_private.knockout_matches where event_id=$1) ko', [e])).rows[0];
    assert.equal(Number(counts.league) + Number(counts.ko), 31);
    assert.deepEqual(report.errors, []);
    await log('same event completed31matches, champion/official Roblox roster public; private TikTok absent');
    report.status = 'PASS';
    await fs.writeFile(out + '/report.json', JSON.stringify(report, null, 2));
    console.log('FINAL PASS', out, e);
}
catch (error) {
    report.status = 'FAIL';
    report.failure = error.stack;
    await fs.writeFile(out + '/report.json', JSON.stringify(report, null, 2));
    await a.screenshot({ path: out + '/failure-owner.png', fullPage: true });
    await p.screenshot({ path: out + '/failure-public.png', fullPage: true });
    throw error;
}
finally {
    await browser.close();
    await db.end();
}

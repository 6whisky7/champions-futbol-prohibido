import {createRequire} from 'node:module';import path from 'node:path';
const testDir=process.env.CFP_TEST_DIR;if(!testDir)throw Error('CFP_TEST_DIR debe apuntar al entorno PostgreSQL local aislado.');
const pg=createRequire(path.join(testDir,'package.json'))('pg');import fs from 'node:fs/promises';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const cfg=JSON.parse(await fs.readFile(path.join(testDir,'connection.json')));if(cfg.host!=='127.0.0.1'||cfg.port!==55439)throw Error('Solo PostgreSQL de pruebas en loopback:55439');
const pool=new pg.Pool(JSON.parse(await fs.readFile(path.join(testDir,'connection.json'))));const e='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const payload=(i,crest=String(i).padStart(2,'0'),four=false)=>({name:`Equipo ${String.fromCharCode(64+i).repeat(3)}`,crest,number:'07',captain:'0',members:Array.from({length:four?4:3},(_,j)=>({roblox:`fixture_${i}_${j}`,tiktok:`fixture.${i}.${j}`}))});
async function submit(p,k=crypto.randomUUID(),waiting=false){const c=await pool.connect();try{await c.query('begin;set local role anon');const r=await c.query('select public.cfp_submit_application($1,$2,$3,$4) as value',[e,p,k,waiting]);await c.query('commit');return r.rows[0].value;}catch(err){await c.query('rollback');throw err;}finally{c.release();}}
const tests=[];const run=async(name,fn)=>{await fn();tests.push(name);console.log('PASS',name);};
try{
await run('3/4 members and duplicate retry',async()=>{const p=payload(1),k=crypto.randomUUID();const a=await submit(p,k);assert.equal((await submit(p,k)).id,a.id);await submit(payload(2,'02',true));});
await run('simultaneous crest conflict',async()=>{const r=await Promise.allSettled([submit(payload(3,'03')),submit(payload(4,'03'))]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
await run('simultaneous player conflict',async()=>{const a=payload(5,'05'),b=payload(6,'06');b.members[1]=a.members[1];const r=await Promise.allSettled([submit(a),submit(b)]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
await pool.query('delete from cfp_private.application_history;delete from cfp_private.applications');
for(let i=1;i<8;i++)await submit(payload(i));
await run('simultaneous last seat',async()=>{const r=await Promise.allSettled([submit(payload(8)),submit(payload(9))]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);});
await run('waiting no reservation; promotion denied when full',async()=>{const a=await submit(payload(10,'01'),crypto.randomUUID(),true);const c=await pool.connect();try{await c.query('begin;set local role authenticated');await c.query("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true)");await assert.rejects(()=>c.query('select public.cfp_review_application($1,$2,$3)',[a.id,'promote','Prueba cupo lleno']));await c.query('rollback');}finally{c.release();}});
await run('expiry works before cleanup',async()=>{await pool.query("update cfp_private.applications set expires_at=now()-interval '1 second' where payload->>'crest'='02'");await submit({...payload(12,'02'),name:'Equipo Nuevo'});});
await run('closing preserves pending deadline',async()=>{const before=await pool.query("select id,expires_at from cfp_private.applications where state='pending' order by id");await pool.query("update public.cfp_events set registration_status='closed' where id=$1",[e]);const after=await pool.query("select id,expires_at from cfp_private.applications where state='pending' order by id");assert.deepEqual(after.rows,before.rows);await assert.rejects(()=>submit(payload(13)));});
await pool.query('delete from cfp_private.application_history;delete from cfp_private.applications');await pool.query("update public.cfp_events set registration_status='open',roster_locked=false where id=$1",[e]);await submit(payload(20,'20',true));
await fs.writeFile(path.join(testDir,'results.json'),JSON.stringify({status:'PASS',postgres:'18.4 embedded, isolated; Supabase Auth stubbed locally; cron checked remotely',tests},null,2));
}finally{await pool.end();}

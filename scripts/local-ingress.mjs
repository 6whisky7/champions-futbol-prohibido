// Local test helper only. Never imported by the application.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir=process.env.CFP_TEST_DIR;assert.ok(dir,'CFP_TEST_DIR required');const cfg=JSON.parse(await fs.readFile(path.join(dir,'connection.json')));assert.equal(cfg.host,'127.0.0.1');assert.equal(cfg.port,55439);
const key=(await fs.readFile(path.join(dir,'ingress-key.txt'),'utf8')).trim();
export function ingressArgs([e,p,k,waiting=false]){const issued=Math.floor(Date.now()/1000),raw=JSON.stringify(p),digest=crypto.createHash('sha256').update(e+':'+String(p.members?.[Number(p.captain)]?.tiktok??k)).digest('hex'),version='test-only-v1';const proof=crypto.createHmac('sha256',key).update([e,k,String(issued),digest,waiting?'1':'0',raw,version].join('\n')).digest('hex');return [e,k,raw,waiting,issued,digest,version,proof];}
export function unwrapIngress(value){if(value.error)throw Error(value.error);return value.result;}

import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.UI_BASE_URL||'http://127.0.0.1:3200';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  for(const path of ['/admin','/admin/solicitudes','/admin/eventos/nuevo','/admin/eventos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']) {
    await page.goto(base+path);assert.ok(page.url().endsWith('/admin/acceso'));await page.getByRole('heading',{name:'Acceso del propietario'}).waitFor();
  }
  await page.getByLabel('Correo del propietario').fill('cfp-outsider@example.invalid');
  await page.getByRole('button',{name:'Recibir enlace de acceso'}).click();
  await page.getByRole('status').filter({hasText:'Si el correo corresponde'}).waitFor();
  await page.goto(base+'/eventos');await page.getByRole('heading',{name:'Eventos del torneo'}).waitFor();
  await page.getByText('Todavía no hay eventos publicados.',{exact:false}).waitFor();
  const draft=await page.goto(base+'/eventos/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');assert.equal(draft.status(),404);
  await page.goto(base+'/auth/callback?code=invalid-test-code');assert.ok(page.url().includes('estado=enlace-invalido'));
  assert.deepEqual(errors,[]);
  await fs.mkdir('output/playwright/events',{recursive:true});
  await page.goto(base+'/admin/acceso');await page.screenshot({path:'output/playwright/events/access.png'});
  console.log('PASS: admin/new/edit sin sesión, rechazo correo ajeno, eventos vacíos, detalle privado 404, callback inválido. La sesión real del propietario fue confirmada manualmente en producción; no se suplanta en esta prueba.');
}finally{await browser.close();}

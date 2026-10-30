import assert from 'node:assert/strict';
import { parseEvent, eventFormats } from '../src/lib/events.ts';
const fixture = { name:'Evento de prueba',description:'Controlado',format:'quarters',capacity:'8',starts_at:'2027-01-01T20:00',ends_at:'2027-01-02T20:00',status:'draft',eliminate_after_league:'yes',registration_status:'closed' };
function form(values={}) { const data=new FormData();for(const [key,value] of Object.entries({...fixture,...values})) data.set(key,value);return data; }
for(const [format,f] of Object.entries(eventFormats)) {
  assert.equal(parseEvent(form({format,capacity:String(f.minimum)})).capacity,f.minimum);
  assert.throws(()=>parseEvent(form({format,capacity:String(f.minimum-2)})));
  assert.equal(parseEvent(form({format,capacity:String(f.minimum),eliminate_after_league:'no'})).eliminate_after_league,false);
  assert.throws(()=>parseEvent(form({format,capacity:String(f.minimum+2),eliminate_after_league:'no'})));
}
assert.throws(()=>parseEvent(form({capacity:'9'})));
assert.throws(()=>parseEvent(form({format:'inventado'})));
assert.throws(()=>parseEvent(form({registration_status:'open'})));
assert.throws(()=>parseEvent(form({status:'open'})));
assert.throws(()=>parseEvent(form({starts_at:'2027-02-30T20:00'})));
assert.throws(()=>parseEvent(form({ends_at:'2026-01-01T20:00'})));
assert.equal(parseEvent(form()).starts_at,'2027-01-02T02:00:00.000Z');
console.log('PASS: cuatro formatos, mínimos, paridad, clasificación, fechas de Costa Rica y bloqueo de inscripciones.');

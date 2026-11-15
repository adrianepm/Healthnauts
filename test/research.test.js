import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';
import { openStore } from '../server/store.js';
import { calculateResearch } from '../shared/research-operations.js';
import { evaluateArea, weightedWindow, exposureLedger, news2 } from '../shared/evaluation.js';
const clock = new Date('2026-11-14T15:00:00Z');
const time = clock.getTime();
const iso = minutes => new Date(time+minutes*60000).toISOString();
const primary = 'astro_demo_001', other = 'astro_other';
const ctx = (astronautId = primary, dataset = 'real') => ({astronautId,dataset});
const base = (id, source = 'manual') => ({id,source,astronautId:primary});
const atmosphere = id => ({ ...base(id),location:'lab',environment:'nominal_cabin',recordedAt:iso(0),pressure:{value:101.325,unit:'kPa'},co2Ppm:5000,oxygenFraction:0.21 });
const calc = (kind, body) => calculateResearch(kind, body, clock);
const assessment = (area, rows, operations = [], context = ctx(), end = time) => evaluateArea(area,rows,operations,context,end);
const sample = (value,unit,recordedAt = iso(-1)) => ({value,unit,recordedAt});
const vitals = {
  heart_rate:sample(91,'bpm'), blood_pressure_systolic:sample(110,'mmHg'), blood_pressure_diastolic:sample(70,'mmHg'),
  respiratory_rate:sample(8,'breaths/min'), spo2:sample(96,'%'), body_temperature:sample(39.1,'Cel'),
  supplemental_oxygen:sample(true,null), consciousness:sample('C',null),
};

test('atmosphere converts compatible inputs and retains separate oxygen quantities', () => {
  const {records,operation} = calc('atmosphere',atmosphere('a'));
  assert.ok(Math.abs(operation.calculation.pressureMmHg-760)<1e-9);
  assert.ok(Math.abs(operation.calculation.partialCo2-3.8)<1e-9);
  assert.ok(Math.abs(operation.calculation.inspiredO2-149.73)<1e-9);
  assert.ok(Math.abs(operation.calculation.partialO2-159.6)<1e-9);
  assert.equal(records.find(r => r.indicator === 'co2_concentration').unit,'ppm');
  assert.throws(() => calc('atmosphere',{...atmosphere('a'),oxygenFraction:21}));
  assert.throws(() => calc('atmosphere',{...atmosphere('a'),pressure:{value:14.7,unit:'psi'}}));
});

test('CO₂ uses elapsed time, handles irregular spacing and refuses gaps, old samples and mixed locations', () => {
  const rows = [-60,-53,-44,-38,-30,-20,-10,0].map((minute,i) => ({
    id:String(i), recordedAt:iso(minute),value:3+minute/1000,
    indicator:'co2_partial_pressure', astronautId:primary, source:'manual', areaId:'hostile_closed_environment',
    context:{location:'lab',environment:'nominal_cabin'},
  }));
  assert.ok(Math.abs(weightedWindow(rows,time).value-2.97)<1e-12);
  assert.equal(weightedWindow([rows[0]],time).coverage,0);
  assert.equal(weightedWindow(rows.filter((_,i) => i!==2),time).value,null);
  const check = input => assessment('hostile_closed_environment',input)[0];
  assert.equal(check(rows.map(r => ({...r,value:3}))).level,null);
  assert.equal(check(rows.map(r => ({...r,value:3.001}))).level,'caution');
  assert.equal(assessment('hostile_closed_environment',rows,[],ctx(),time+11*60000)[0].status,'stale');
  assert.ok(assessment('hostile_closed_environment',rows.map((r,i) => i===2 ? {...r,context:{...r.context,location:'other'}} : r)).every(e => ['insufficient_data','stale'].includes(e.status)));
});

test('NEWS2 retains exercise components, ACVPU, categories and incomplete observations', () => {
  const body = { ...base('vital'),recordedAt:iso(0),activity:'exercise',spo2Scale:1,measurements:vitals };
  const { operation,records } = calc('vitals',body);
  const result = news2(operation,records,time);
  assert.deepEqual(result.components,{ respiratory_rate:3,spo2:0,blood_pressure_systolic:1,heart_rate:1,body_temperature:2,supplemental_oxygen:2,consciousness:3 });
  assert.equal(result.score,12);
  assert.equal(result.scientificCategory,'high');
  assert.equal(news2(operation,records,time+3600001).status,'stale');
  const incomplete = calc('vitals',{...body,measurements:{heart_rate:vitals.heart_rate}});
  assert.equal(news2(incomplete.operation,incomplete.records,time).score,null);
  const low = calc('vitals',{...body,measurements:{...vitals, respiratory_rate:sample(16,'breaths/min'), blood_pressure_systolic:sample(120,'mmHg'),
    heart_rate:sample(75,'bpm'),body_temperature:sample(37,'Cel'),supplemental_oxygen:sample(false,null),consciousness:sample('A',null)}});
  assert.equal(news2(low.operation,low.records,time).scientificCategory,'low');
  const single = calc('vitals',{...body,measurements:{...low.operation.input.measurements,respiratory_rate:vitals.respiratory_rate}});
  assert.equal(news2(single.operation,single.records,time).scientificCategory,'low_medium');
  assert.throws(() => calc('vitals',{...body,spo2Scale:2}));
  assert.throws(() => calc('vitals',{...body,measurements:{...vitals,heart_rate:sample(75,'bpm',iso(-6))}}));
});

test('dosimetry separates physical quantities, takes latest counter and rejects overlapping or mixed ledgers', () => {
  const standard = { ...base('dose'),missionId:'m1',scope:'mission',quantity:'effective',organ:null,mode:'counter',seriesId:'dosimeter',
    periodStart:iso(-180),recordedAt:iso(-60),value:1,unit:'Sv',completePriorHistory:false };
  const first = calc('radiation',standard).records[0];
  const second = calc('radiation',{...standard,recordedAt:iso(0),value:1200,unit:'mSv'}).records[0];
  assert.equal(exposureLedger([first,second]).value,1200);
  const increment = calc('radiation',{...standard,mode:'increment'}).records[0];
  assert.equal(exposureLedger([increment,second]).reason,'mixed_ledgers');
  const next = calc('radiation',{...standard,mode:'increment',periodStart:iso(-60),recordedAt:iso(0)}).records[0];
  assert.equal(exposureLedger([increment,next]).value,2000);
  const overlap = {...next,periodStart:iso(-61)};
  assert.equal(exposureLedger([increment,overlap]).reason,'overlapping_intervals');
  assert.throws(() => calc('radiation',{...standard,quantity:'absorbed',organ:'skin'}));
  assert.equal(assessment('radiation',[first,second]).find(e => e.indicator==='career_effective_dose').status,'insufficient_data');
  const mission = calc('mission',{...base('mission'),missionId:'m1',startedAt:iso(-180),recordedAt:iso(-180),destination:'ISS',
    activity:'routine',communication:'available',solarConjunction:false,oneWaySeconds:1,medicalResources:'Demo'});
  const prior = calc('radiation',{...standard,id:'prior',scope:'prior_spaceflight',periodStart:iso(-400),recordedAt:iso(-200),
    completePriorHistory:true,value:350,unit:'mSv',doseMethod:'NASA_Q'});
  const current = calc('radiation',{...standard,value:100,unit:'mSv',doseMethod:'NASA_Q'});
  const career = assessment('radiation',[...prior.records,...current.records],[prior.operation,current.operation,mission.operation]).find(e => e.indicator==='career_effective_dose');
  assert.equal(career.value,450); assert.equal(career.percentOfLimit,75); assert.equal(career.level,'advisory');
});

test('preflight comparison requires compatible method, mission and nonzero reference', () => {
  const mission = calc('mission',{...base('mission'),missionId:'m1',startedAt:iso(-100),recordedAt:iso(-100),destination:'ISS',
    activity:'routine',communication:'available',solarConjunction:false,oneWaySeconds:1,medicalResources:'Demo'}).operation;
  const reference = value => calc('reference',{...base('reference'),missionId:'m1',method:'cycle',indicator:'aerobic_capacity',
    recordedAt:iso(-101),value,unit:'mL/kg/min'}).operation;
  const record = {id:'r',areaId:'gravity_fields',astronautId:primary,source:'manual',recordedAt:iso(0),
    indicator:'aerobic_capacity',value:31.999,unit:'mL/kg/min',context:{missionId:'m1',method:'cycle'}};
  const check = (r,...refs) => assessment('gravity_fields',[r],[mission,...refs]).find(e => e.indicator==='aerobic_capacity');
  assert.equal(check(record,reference(40)).level,'caution');
  assert.equal(check({...record,value:32},reference(40)).level,'advisory');
  assert.equal(check(record,reference(0)).percentOfReference,null);
  assert.equal(check({...record,context:{...record.context,method:'treadmill'}},reference(40)).status,'insufficient_data');
  assert.equal(check(record,{...reference(40),source:'simulated'}).status,'insufficient_data');
});

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(),'nasa-research-'));
  const file = join(dir,'records.json');
  const store = await openStore(file,clock);
  const server = createApp(store,{now:() => clock}).listen(0,'127.0.0.1');
  await new Promise((resolve,reject) => { server.once('listening',resolve); server.once('error',reject); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await rm(dir,{recursive:true}); });
  const request = async (path, body) => {
    const r = await fetch('http://127.0.0.1:'+server.address().port+'/api/v1'+path,body === undefined ? undefined :
      {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    return {status:r.status,body:await r.json()};
  };
  return { request,store,file };
}
const query = (astronautId = primary, dataset = 'simulated') => '?astronautId='+astronautId+'&dataset='+dataset;

test('scenarios exercise the rules, persist alerts once and prepare an unsent outage report', async t => {
  const {request,store,file} = await fixture(t);
  const list = (await request('/scenarios')).body.scenarios;
  assert.equal(list.length,8);
  for (const scenario of list.slice(0,5)) {
    const body = { id:scenario.id,astronautId:primary };
    const first = await request('/scenarios/'+scenario.id,body);
    assert.equal(first.status,201,JSON.stringify(first.body));
    assert.ok(first.body.records.every(r => r.source==='simulated'));
    assert.ok(first.body.operation.calculation.assessments.some(e => e.level),scenario.id);
    const length = store.all().length;
    assert.equal((await request('/scenarios/'+scenario.id,body)).status,200);
    assert.equal(store.all().length,length);
    if (scenario.id==='offline-report') {
      const out = await request('/areas/distance_from_earth/operations/report/'+first.body.operation.calculation.reportId+query());
      assert.equal(out.status,200);
      assert.equal(out.body.operation.calculation.deliveryStatus,'not_sent');
      assert.equal(out.body.operation.calculation.communication.status,'unavailable');
      assert.equal(out.body.operation.calculation.communication.estimatedResponseSeconds,null);
    }
  }
  const bytes = await readFile(file,'utf8');
  const alerts = (await request('/alerts'+query())).body;
  assert.ok(alerts.alerts.length>=5);
  assert.ok(alerts.alerts.every(e => e.recordIds.length && e.rule.version && e.followUp==='in_observation'));
  await request('/areas/radiation'+query());
  await request('/alerts'+query());
  assert.equal(await readFile(file,'utf8'),bytes);
  assert.deepEqual((await openStore(file,clock)).assessments(),store.assessments());
  assert.equal((await request('/alerts'+query(other))).body.alerts.length,0);
  assert.equal((await request('/alerts'+query(primary,'real'))).body.alerts.length,0);
});

test('legacy repeat does not duplicate alerts and distinct observations remain auditable', async t => {
  const {request,store} = await fixture(t);
  const path = '/areas/isolation_confinement/records';
  const reading = {indicator:'sleep_duration',recordedAt:iso(-5),value:3,unit:'h',source:'manual'};
  for (const r of [reading, reading, {...reading,recordedAt:iso(-4)}]) {
    assert.equal((await request(path,{astronautId:primary,records:[r]})).status,201);
  }
  assert.equal(store.assessments().filter(e => e.indicator==='sleep_duration' && e.dataset==='real' && e.level).length,2);
  await request(path,{astronautId:primary,records:[{...reading,indicator:'stress',value:80,unit:null}]});
  const result = await request('/areas/distance_from_earth/operations/report',{...base('private'),actions:[]});
  assert.ok(result.body.operation.calculation.indicators.every(r => r.indicator!=='stress'));
});

test('v2 operation data stays intact with added history and isolated astronaut data', async t => {
  const {file,store} = await fixture(t);
  const original = store.all();
  const existing = {kind:'old',id:'old',input:{},recordIds:[],astronautId:primary,source:'manual'};
  await writeFile(file,JSON.stringify({schemaVersion:2,records:original,operations:[existing]}));
  const migrated = await openStore(file,clock);
  const payload = { ...base('vitals'),astronautId:other,activity:'routine',spo2Scale:1,recordedAt:iso(0),measurements:vitals };
  const submitted = calc('vitals',payload);
  await migrated.saveOperation(submitted.operation,submitted.records,time);
  const reread = await openStore(file,clock);
  assert.deepEqual(reread.operations()[0],existing);
  assert.deepEqual(reread.all().slice(0,original.length),original);
  assert.ok(reread.assessments().every(e => e.astronautId===other));
  assert.equal((await reread.saveOperation(submitted.operation,submitted.records,time)).replayed,true);
  assert.equal(reread.assessments().length,1);
});

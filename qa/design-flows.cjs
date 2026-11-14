const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const frontend = process.env.QA_FRONTEND || 'http://127.0.0.1:31962';
const api = process.env.QA_API || 'http://127.0.0.1:31961/api/v1';

(async () => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  const dlg = () => page.getByRole('dialog');
  const done = () => dlg().getByRole('button', { name: 'Done', exact: true }).click();
  const path = suffix => frontend + suffix;
  const click = name => page.getByRole('button', { name, exact: true }).click();
  const waitText = text => dlg().getByText(text, { exact: false }).first().waitFor();
  const post = suffix => page.waitForResponse(response => response.url() === api + suffix && response.request().method() === 'POST');
  const fill = (name, value) => dlg().getByLabel(name, { exact: true }).fill(value);
  const select = (name, value) => dlg().getByLabel(name, { exact: true }).selectOption(value);
  const localDate = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  try {
    await page.goto(path('/'));
    await page.locator('.hazard-node').first().focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'Space Radiation', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Overview', exact: true }).last().click();
    await page.getByRole('heading', { name: 'Mission health overview' }).waitFor();
    await page.getByLabel('Crew member').selectOption('astro_demo_003');
    await page.getByLabel('Data source').selectOption('real');
    await page.locator('.hazard-node').getByText('No records').first().waitFor();
    await page.route(api+'/**', route => route.abort());
    await page.reload();
    await page.getByLabel("Crew member").selectOption("astro_demo_003");
    await page.getByLabel("Data source").selectOption("real");
    await page.getByText('Connection unavailable').waitFor();
    await page.unroute(api+'/**');
    await click('Try again');
    await page.getByText('No open observations').waitFor();

    await page.goto(path('/isolamento'));
    await click('Daily check-in');
    await dlg().getByRole('button', { name: 'Save check-in' }).click();
    assert.equal(await dlg().locator('input:invalid').count(), 5);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Daily check-in');
    await click('Daily check-in');
    for (const value of ['66', '30', '74', '3', '4']) {
      await dlg().locator('input:invalid').first().fill(value);
    }
    const checkin = post('/areas/isolation_confinement/records');
    await click('Save check-in');
    assert.equal((await checkin).status(), 201);
    await waitText('Record saved');
    await done();

    await click('Record sleep');
    const now = Date.now();
    await fill('Wake time', localDate(new Date(now-3600000)));
    await fill('Bedtime', localDate(new Date(now-9*3600000)));
    await fill('Time to fall asleep (min)', '20');
    await fill('Time awake after falling asleep (min)', '25');
    const sleepRoute = api+'/areas/isolation_confinement/sleep-episodes';
    let original;
    await page.route(sleepRoute, async route => { original = await route.fetch(); await route.abort(); }, { times: 1 });
    await click('Save sleep entry');
    await waitText('Save could not be confirmed');
    assert.equal(original.status(), 201);
    const replay = post('/areas/isolation_confinement/sleep-episodes');
    await click('Retry same entry');
    const replayResult = await replay;
    assert.equal(replayResult.status(), 200);
    assert.equal((await replayResult.json()).operation.calculation.durationHours, 7.25);
    await waitText('7.25 hours asleep');
    await done();

    const pvtRoute = '/areas/isolation_confinement/pvt-sessions';
    await click('Start reaction test');
    await dlg().getByRole('button', {name:'Start reaction test',exact:true}).click();
    await click('Stop session');
    const stopped = post(pvtRoute);
    await click('Save interrupted session');
    const interrupted = await stopped;
    assert.equal(interrupted.status(), 201);
    assert.equal((await interrupted.json()).records.length, 0);
    await waitText('Interrupted session saved');
    await done();
    console.log('Keyboard, empty context, reconnect, required values, check-in, sleep replay and interrupted PVT passed.');

    if (process.env.QA_FULL_PVT === '1') {
      await click('Start reaction test');
      await dlg().getByRole('button',{name:'Start reaction test',exact:true}).click();
      const target = dlg().getByRole('button',{name:'Respond now',exact:true});
      const save = dlg().getByRole('button',{name:'Save test results',exact:true});
      const end = Date.now()+200000;
      while (!(await save.isVisible()) && Date.now()<end) {
        if (await target.isVisible()) { await page.waitForTimeout(160); await target.click({timeout:1000}); }
        else await page.waitForTimeout(90);
      }
      assert.ok(await save.isVisible(), 'PVT never reached ready state: ' + await dlg().innerText());
      const [result] = await Promise.all([post(pvtRoute), save.click()]);
      const response = await result.json();
      assert.equal(result.status(),201,JSON.stringify(response));
      assert.equal(response.records.length,3);
      console.log('Completed PVT:', response.operation.input.durationMs, 'ms,', response.records.length, 'aggregates');
      await done();
    }

    await page.goto(path('/ambiente'));
    await click('Record cabin air');
    await fill('Measurement location', 'Design deck');
    await fill('Absolute cabin pressure', '760');
    await fill('Carbon dioxide (ppm)', '1500');
    await fill('Oxygen fraction', '0.21');
    const air = post('/areas/hostile_closed_environment/operations/atmosphere');
    await click('Save cabin readings');
    assert.equal((await air).status(),201);
    await waitText('1.14 mmHg');
    await done();

    await page.goto(path('/gravidade'));
    await click('Record vital signs');
    for (const [name, value] of [
      ['Heart rate (bpm)','72'], ['Systolic blood pressure (mmHg)','118'], ['Diastolic blood pressure (mmHg)','76'],
      ['Breathing rate (breaths/min)','15'], ['Blood oxygen saturation (SpO₂) (%)','98'], ['Body temperature (°C)','36.7'],
    ]) await fill(name,value);
    const vitals = post('/areas/gravity_fields/operations/vitals');
    await click('Save vital signs');
    assert.equal((await vitals).status(),201);
    await waitText('NEWS2: 0');
    await done();

    await page.goto(path('/distancia'));
    await click('Update mission');
    await fill('Mission name','Design demo');
    await select('Destination','Mars');
    await fill('Mission start',localDate(new Date(now-86400000)));
    await select('Connection status','unavailable');
    await fill('Onboard medical resources','Fictional first-aid kit');
    const mission = post('/areas/distance_from_earth/operations/mission');
    await click('Save mission context');
    assert.equal((await mission).status(),201);
    await waitText('Mission context saved');
    await done();
    await click('Prepare report');
    const report = post('/areas/distance_from_earth/operations/report');
    await dlg().getByRole('button',{name:'Prepare report',exact:true}).click();
    const response = await report;
    assert.equal(response.status(),201);
    const { operation } = await response.json();
    assert.equal(operation.calculation.deliveryStatus,'not_sent');
    assert.equal(operation.calculation.communication.status,'unavailable');
    await waitText('Report prepared · Not sent');
    await done();

    await click('Scenarios');
    await dlg().getByRole('combobox',{name:'Scenario',exact:true}).selectOption('high-co2');
    const scenario = post('/scenarios/high-co2');
    await click('Run scenario');
    assert.equal((await scenario).status(),201);
    await dlg().getByRole('link',{name:'Open affected area'}).click();
    await page.getByRole('heading',{name:'Attention & follow-up',exact:true}).waitFor();
    assert.deepEqual(browserErrors,[]);
    console.log('Atmosphere, NEWS2, mission, unsent report and high CO₂ scenario passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

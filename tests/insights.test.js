import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import '../data.js';

const { insights, registries, capabilities, shipped } = globalThis.RegistryAtlas;
const insight = id => insights.find(item => item.id === id);

test('all nine insights have visible evidence, recommendations, and valid source links', () => {
  assert.equal(insights.length, 9);
  assert.equal(new Set(insights.map(item => item.id)).size, insights.length);
  for (const item of insights) {
    for (const field of ['tag', 'title', 'stat', 'label', 'text', 'implication', 'kind']) {
      assert.ok(item[field]?.trim(), `${item.id}: missing ${field}`);
    }
    assert.ok(['blue', 'green', 'rose'].includes(item.color));
    assert.ok(item.pages.length > 0);
    assert.ok(item.pages.every(page => Number.isInteger(page) && page >= 1 && page <= 32));
    assert.ok(item.codes.length > 0);
    assert.ok(item.codes.every(code => capabilities.some(cap => cap.id === code)));
  }
});

test('headline comparisons match the shipped control cohorts', () => {
  assert.deepEqual(shipped('Z4').map(item => item.id), ['npm', 'pypi', 'nuget', 'rubygems', 'crates']);
  assert.deepEqual(shipped('Z4').filter(item => item.ratings.X8 === 'S').map(item => item.id), ['npm']);
  assert.equal(insight('workflow-trust').stat, '1 / 5');
  assert.equal(shipped('X13').length, 0);
  assert.equal(insight('response-loop').stat, '0 / 15');
  assert.deepEqual(shipped('X12').map(item => item.id), ['packagist']);
  assert.equal(insight('inherited-trust').stat, '1 / 15');
  assert.deepEqual(shipped('C5').map(item => item.id), ['go']);
  assert.equal(insight('triage-bottleneck').stat, '1 / 15');
  assert.equal(insight('architecture').stat, '18 N/A');
});

test('layered-barrier and package-coverage claims retain their caveats', () => {
  const controls = insight('layered-barriers').codes;
  assert.equal(controls.length, 6);
  assert.deepEqual(registries.filter(item => controls.every(code => item.ratings[code] === 'S')).map(item => item.id), ['debian']);
  assert.match(insight('layered-barriers').text, /reproducibility is not universal/);
  assert.ok(Math.abs(370 / 190000 * 100 - 0.195) < 0.001);
  assert.match(insight('effective-coverage').text, /not download share/);
  assert.match(insight('sustainable-security').text, /not proof of causation/);
});

test('the full ratings matrix is retained', () => {
  assert.equal(registries.length, 16);
  assert.equal(capabilities.length, 45);
  assert.equal(registries.reduce((count, item) => count + Object.keys(item.ratings).length, 0), 720);
  for (const registry of registries) {
    assert.ok(capabilities.every(cap => ['S', 'P', 'N', 'R', 'X'].includes(registry.ratings[cap.id])));
  }
});

test('insight rendering has one always-visible grid with no disclosure elements', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const section = html.match(/<section id="insights"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(section, /id="insights-grid"/);
  assert.doesNotMatch(section, /<details|<summary|\shidden(?=[\s=>])|role="tabpanel"/);
  const renderer = app.slice(app.indexOf("document.querySelector('#insights-grid')"), app.indexOf("primarySelect.addEventListener('change'"));
  assert.match(renderer, /insights\.map/);
  assert.doesNotMatch(renderer, /<details|<summary|\shidden(?=[\s=>])|\.slice\(/);
  assert.match(renderer, /insight\.text/);
  assert.match(renderer, /insight\.implication/);
  assert.match(renderer, /sources\(insight\.pages\)/);
});

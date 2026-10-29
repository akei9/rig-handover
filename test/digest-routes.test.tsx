import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/types.js';

let runsDir = '';

const line = (job: string, status: string, owner: string | null, extra: object = {}) =>
  JSON.stringify({ at: '2026-10-31T02:00:00+01:00', job, status, owner, ...extra });

const makeApp = () =>
  createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

const jobOrder = (html: string, jobs: string[]) =>
  jobs.map((j) => ({ j, i: html.indexOf(j) })).sort((a, b) => a.i - b.i).map((x) => x.j);

beforeAll(() => {
  process.env.LANE_MARKER = 'TEST-MARKER';
  runsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rig-runs-'));
  fs.copyFileSync('runs/2026-10-28.jsonl', path.join(runsDir, '2026-10-28.jsonl'));
  fs.writeFileSync(path.join(runsDir, '2026-10-30.jsonl'), '');
  fs.writeFileSync(
    path.join(runsDir, '2026-10-31.jsonl'),
    [line('a/one', 'ok', null), line('b/two', 'fail', 'x', { error: 'boom' }), 'not json'].join('\n') + '\n',
  );
});

afterAll(() => {
  fs.rmSync(runsDir, { recursive: true, force: true });
});

describe('GET /digest/:night', () => {
  it('renders the page with banner and one row per job', async () => {
    const res = await makeApp().request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('TEST-MARKER');
    const night = (await (await makeApp().request('/api/digest/2026-10-28')).json()) as Night;
    expect(night.rows).toHaveLength(5);
    for (const r of night.rows) expect(html).toContain(r.job);
  });

  it('404 when the night has no file', async () => {
    expect((await makeApp().request('/digest/2026-01-01')).status).toBe(404);
  });

  it('404 when the night is not a date', async () => {
    expect((await makeApp().request('/digest/not-a-date')).status).toBe(404);
  });

  it('says nothing ran for an empty file', async () => {
    const res = await makeApp().request('/digest/2026-10-30');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('counts a bad line, keeps valid rows, renders missing owner as a dash', async () => {
    const res = await makeApp().request('/digest/2026-10-31');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('1 line in the run log did not parse');
    expect(html).toContain('a/one');
    expect(html).toContain('b/two');
    expect(html).toContain('boom');
    expect(html).toContain('—');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the night, rows sorted by job', async () => {
    const res = await makeApp().request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const night = (await res.json()) as Night;
    expect(night.night).toBe('2026-10-28');
    expect(night.rows).toHaveLength(5);
    expect(night.badLines).toBe(1);
    expect(night.counts).toBeDefined();
    const jobs = night.rows.map((r) => r.job);
    expect(jobs).toEqual([...jobs].sort());
  });

  it('404 with a JSON body when the night has no file', async () => {
    const res = await makeApp().request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toBeTypeOf('object');
  });

  it('404 when the night is not a date', async () => {
    expect((await makeApp().request('/api/digest/not-a-date')).status).toBe(404);
  });

  it('empty file gives no rows and no bad lines', async () => {
    const res = await makeApp().request('/api/digest/2026-10-30');
    expect(res.status).toBe(200);
    const night = (await res.json()) as Night;
    expect(night.rows).toEqual([]);
    expect(night.badLines).toBe(0);
  });

  it('counts a bad line and keeps valid rows', async () => {
    const res = await makeApp().request('/api/digest/2026-10-31');
    expect(res.status).toBe(200);
    const night = (await res.json()) as Night;
    expect(night.badLines).toBe(1);
    expect(night.rows.map((r) => r.job)).toEqual(['a/one', 'b/two']);
    expect(night.rows[0]?.owner).toBeNull();
  });
});

describe('page and JSON agree', () => {
  it('lists the same jobs in the same order on 2026-10-28', async () => {
    const app = makeApp();
    const night = (await (await app.request('/api/digest/2026-10-28')).json()) as Night;
    const html = await (await app.request('/digest/2026-10-28')).text();
    const jobs = night.rows.map((r) => r.job);
    expect(jobOrder(html, jobs)).toEqual(jobs);
  });
});

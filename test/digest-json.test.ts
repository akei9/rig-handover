import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp({
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: 'runs',
});

describe('GET /api/digest/:night', () => {
  it('returns the night as read', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(body.badLines).toBe(1);
  });

  it('404s for a night without a log', async () => {
    const res = await app.request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
  });
});

// Plan morning-digest § 1. The contract every part of § 2 starts against: the reader fills it,
// the page, the JSON and the board read it, so they can never disagree (ADR 0001).

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, after it parsed.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night.
export type DigestRow = {
  job: string;
  owner: string | null; // from the job's last line; null is kept, views show `—`
  runs: number; // lines for this job
  retries: number; // lines with status `retry`
  lastStatus: RunStatus;
  lastError: string | null; // `error` of the last line that had one
  firstAt: string; // `at` as written in the log, offset kept (styleguide)
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  counts: Record<RunStatus, number>; // lines per status, for the board
  badLines: number; // lines that did not parse; counted, never thrown
};

// Reads runs/<night>.jsonl. null when the night has no file; an empty file gives no rows.
export type ReadNight = (runsDir: string, night: string) => Night | null;

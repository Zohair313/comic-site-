import fs from 'node:fs';
import path from 'node:path';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readJson(file, fallback) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return clone(fallback);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return clone(fallback);
    return parsed;
  } catch {
    return clone(fallback);
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function withLock() {
  let queue = Promise.resolve();
  return (fn) => {
    const run = queue.then(fn, fn);
    queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };
}

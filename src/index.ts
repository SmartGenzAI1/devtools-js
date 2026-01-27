import fs from "fs/promises";
import crypto from "crypto";

/* ---------------- sleep ---------------- */
export const sleep = (ms: number) =>
  new Promise<void>(r => setTimeout(r, ms));


/* ---------------- retry ---------------- */
export async function retry<T>(
  fn: () => Promise<T>,
  times = 3,
  delay = 300
): Promise<T> {
  let err: any;

  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      await sleep(delay * (i + 1));
    }
  }

  throw err;
}


/* ---------------- uuid ---------------- */
export const uuid = () => crypto.randomUUID();


/* ---------------- logger ---------------- */
const t = () => new Date().toISOString();

export const logger = {
  info: (...m: any[]) => console.log(t(), "ℹ️", ...m),
  success: (...m: any[]) => console.log(t(), "✅", ...m),
  warn: (...m: any[]) => console.warn(t(), "⚠️", ...m),
  error: (...m: any[]) => console.error(t(), "❌", ...m)
};


/* ---------------- JSON ---------------- */
export const readJSON = async <T = any>(path: string): Promise<T> =>
  JSON.parse(await fs.readFile(path, "utf-8"));

export const writeJSON = async (path: string, data: unknown) =>
  fs.writeFile(path, JSON.stringify(data, null, 2));


/* ---------------- fileExists ---------------- */
export async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}


/* ---------------- debounce ---------------- */
export function debounce<T extends (...a: any[]) => any>(
  fn: T,
  wait = 300
) {
  let timer: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}


/* ---------------- throttle ---------------- */
export function throttle<T extends (...a: any[]) => any>(
  fn: T,
  wait = 300
) {
  let last = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    }
  };
}


/* ---------------- deepClone ---------------- */
export const deepClone = <T>(obj: T): T =>
  structuredClone(obj);


/* ---------------- randomString ---------------- */
export function randomString(len = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}


/* ---------------- timer ---------------- */
export function timer(label = "Timer") {
  const start = Date.now();

  return () => {
    logger.info(`${label}: ${Date.now() - start}ms`);
  };
}


/* ---------------- safeTry ---------------- */
export async function safeTry<T>(fn: () => Promise<T>) {
  try {
    return [null, await fn()] as const;
  } catch (e) {
    return [e, null] as const;
  }
}


/* ---------------- bytes formatter ---------------- */
export function bytes(n: number) {
  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;

  while (n >= 1024 && i < sizes.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(2)} ${sizes[i]}`;
}


/* ---------------- hash ---------------- */
export function hash(input: string, algo = "sha256") {
  return crypto.createHash(algo).update(input).digest("hex");
}


/* ---------------- asyncQueue (very useful!) ---------------- */
export async function asyncQueue<T>(
  tasks: (() => Promise<T>)[],
  limit = 3
): Promise<T[]> {
  const results: T[] = [];
  const running: Promise<any>[] = [];

  for (const task of tasks) {
    const p = task().then(r => results.push(r));
    running.push(p);

    if (running.length >= limit) {
      await Promise.race(running);
      running.splice(
        running.findIndex(x => x === p),
        1
      );
    }
  }

  await Promise.all(running);
  return results;
}


/* ---------------- isEmpty ---------------- */
export function isEmpty(val: any) {
  if (val == null) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.keys(val).length === 0;
  return false;
}

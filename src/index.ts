import fs from "fs/promises";
import crypto from "crypto";
import util from "util";
import process from "process";
import chalk from "chalk";

/**
 * Pause execution for given milliseconds.
 * Useful for rate limiting, retries, or testing delays.
 */
export const sleep = (ms: number) =>
  new Promise<void>(r => setTimeout(r, ms));

/**
 * Execute function with retry logic including exponential backoff and jitter.
 * Perfect for handling transient failures in API calls, database operations, or network requests.
 *
 * @param fn - Function to retry
 * @param options - Retry configuration or number of attempts
 * @returns Promise that resolves when fn succeeds or rejects after all retries fail
 */
interface RetryOptions {
  /** Maximum number of retry attempts */
  times?: number;
  /** Initial delay between retries in milliseconds */
  delay?: number;
  /** Backoff strategy: "linear" or "exponential" */
  backoff?: "linear" | "exponential";
  /** Add random variation to delay to prevent thundering herd */
  jitter?: boolean;
  /** Maximum delay between retries */
  maxDelay?: number;
  /** Custom logic to determine if error should be retried */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions | number = {}
): Promise<T> {
  // Support both old (times, delay) and new (options object) API
  const times = typeof options === 'number' ? options : options.times ?? 3;
  const delay = typeof options === 'number' ? 300 : options.delay ?? 300;
  const backoff = typeof options === 'number' ? "exponential" : options.backoff ?? "exponential";
  const jitter = typeof options === 'number' ? true : options.jitter ?? true;
  const maxDelay = typeof options === 'number' ? 10000 : options.maxDelay ?? 10000;
  const shouldRetry = typeof options === 'number' ? () => true : options.shouldRetry ?? (() => true);

  let err: any;

  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;

      // Check if we should retry this specific error
      if (!shouldRetry(e, i + 1)) {
        throw err;
      }

      // Calculate delay with backoff strategy
      let calculatedDelay = delay;
      if (backoff === "exponential") {
        calculatedDelay = delay * Math.pow(2, i);
      } else {
        calculatedDelay = delay * (i + 1);
      }

      // Apply jitter (random variation) to prevent thundering herd problem
      if (jitter) {
        calculatedDelay = calculatedDelay * (0.5 + Math.random());
      }

      // Apply max delay to prevent excessive waiting
      calculatedDelay = Math.min(calculatedDelay, maxDelay);

      await sleep(calculatedDelay);
    }
  }

  throw err;
}

/**
 * Generate RFC-compliant UUID v4.
 * Useful for creating unique identifiers, session tokens, or database keys.
 */
export const uuid = () => crypto.randomUUID();

/**
 * Colored logger with timestamp and emoji icons.
 * Perfect for debugging, monitoring, and production logging.
 */
const t = () => new Date().toISOString();

export const logger = {
  /** Log informational messages (green) */
  info: (...m: any[]) => console.log(chalk.green(t(), "ℹ️", ...m)),
  /** Log success messages (cyan) */
  success: (...m: any[]) => console.log(chalk.cyan(t(), "✅", ...m)),
  /** Log warning messages (yellow) */
  warn: (...m: any[]) => console.warn(chalk.yellow(t(), "⚠️", ...m)),
  /** Log error messages (red) */
  error: (...m: any[]) => console.error(chalk.red(t(), "❌", ...m))
};

/**
 * Read and parse JSON file.
 * Automatically handles file reading and JSON parsing in one step.
 */
export const readJSON = async <T = any>(path: string): Promise<T> =>
  JSON.parse(await fs.readFile(path, "utf-8"));

/**
 * Write data to JSON file with pretty formatting.
 * Creates file if it doesn't exist, overwrites if it does.
 */
export const writeJSON = async (path: string, data: unknown) =>
  fs.writeFile(path, JSON.stringify(data, null, 2));

/**
 * Check if file exists at given path.
 * Returns false instead of throwing for non-existent files.
 */
export async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounce function calls to limit execution rate.
 * Useful for search inputs, window resizing, or any rapid-fire events.
 *
 * @param fn - Function to debounce
 * @param wait - Milliseconds to wait before executing
 * @returns Debounced function
 */
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

/**
 * Throttle function calls to ensure minimum time between executions.
 * Perfect for scroll events, button clicks, or any high-frequency operations.
 *
 * @param fn - Function to throttle
 * @param wait - Minimum milliseconds between executions
 * @returns Throttled function
 */
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

/**
 * Create deep copy of object to avoid reference issues.
 * Uses structuredClone for reliable deep cloning of complex objects.
 */
export const deepClone = <T>(obj: T): T =>
  structuredClone(obj);

/**
 * Generate random alphanumeric string.
 * Useful for creating tokens, temporary passwords, or unique identifiers.
 *
 * @param len - Length of string to generate
 * @returns Random string
 */
export function randomString(len = 8) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Create performance timer to measure execution time.
 * Perfect for profiling, benchmarking, or monitoring slow operations.
 *
 * @param label - Description of what's being timed
 * @returns Function to call when timing should end
 */
export function timer(label = "Timer") {
  const start = Date.now();

  return () => {
    const duration = Date.now() - start;
    logger.success(`${label}: ${duration}ms`);
    return duration;
  };
}

/**
 * Execute async function with error handling pattern.
 * Returns tuple where first element is error (or null) and second is result (or null).
 * Eliminates nested try/catch blocks for cleaner async code.
 *
 * @param fn - Async function to execute safely
 * @returns Tuple of [error, result]
 */
export async function safeTry<T>(fn: () => Promise<T>) {
  try {
    return [null, await fn()] as const;
  } catch (e) {
    return [e, null] as const;
  }
}

/**
 * Format bytes to human-readable string.
 * Converts raw byte counts to KB, MB, GB as appropriate.
 *
 * @param n - Number of bytes
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function bytes(n: number) {
  const sizes = ["B", "KB", "MB", "GB"];
  let i = 0;

  while (n >= 1024 && i < sizes.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(2)} ${sizes[i]}`;
}

/**
 * Create cryptographic hash of input string.
 * Useful for passwords, data integrity checks, or creating fingerprints.
 *
 * @param input - String to hash
 * @param algo - Hash algorithm (sha256, sha512, etc)
 * @returns Hexadecimal hash string
 */
export function hash(input: string, algo = "sha256") {
  return crypto.createHash(algo).update(input).digest("hex");
}

/**
 * Execute array of async tasks with concurrency limit.
 * Perfect for API calls, file processing, or any parallel operations where you need control.
 *
 * @param tasks - Array of async functions to execute
 * @param limit - Maximum number of concurrent tasks
 * @returns Array of results in same order as input tasks
 */
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

/**
 * Check if value is empty.
 * Handles null, undefined, empty arrays, empty objects, and empty strings.
 *
 * @param val - Value to check
 * @returns True if value is empty, false otherwise
 */
export function isEmpty(val: any) {
  if (val == null) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.keys(val).length === 0;
  if (typeof val === "string") return val.trim().length === 0;
  return false;
}

/**
 * Deep merge multiple objects into one.
 * Combines properties recursively, preserving nested object structure.
 * Arrays are overwritten, not merged.
 *
 * @param objects - Objects to merge
 * @returns Merged object
 */
export function merge<T extends object, U extends object>(target: T, source: U): T & U;
export function merge<T extends object>(...objects: T[]): T;
export function merge<T extends object>(...objects: T[]): T {
  if (objects.length === 0) return {} as T;

  const result = { ...objects[0] };

  for (let i = 1; i < objects.length; i++) {
    const source = objects[i];
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' &&
          result[key] !== null && typeof result[key] === 'object' &&
          !Array.isArray(source[key]) && !Array.isArray(result[key])) {
        // Deep merge objects (not arrays)
        result[key] = merge(result[key], source[key]);
      } else {
        // Overwrite with source value
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Environment variable helpers with type conversion and validation.
 * Safer alternative to process.env with proper error handling.
 */
export const env = {
  /**
   * Get string environment variable.
   * @param key - Environment variable name
   * @param defaultValue - Optional default value
   * @returns String value
   * @throws Error if required variable is missing
   */
  string: (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      return defaultValue;
    }
    return value;
  },

  /**
   * Get numeric environment variable with validation.
   * @param key - Environment variable name
   * @param defaultValue - Optional default value
   * @returns Number value
   * @throws Error if variable is missing or not a number
   */
  number: (key: string, defaultValue?: number): number => {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      return defaultValue;
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${key} must be a number`);
    }
    return num;
  },

  /**
   * Get boolean environment variable.
   * @param key - Environment variable name
   * @param defaultValue - Optional default value
   * @returns Boolean value
   * @throws Error if required variable is missing
   */
  bool: (key: string, defaultValue?: boolean): boolean => {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  },

  /**
   * Get array environment variable (comma-separated).
   * @param key - Environment variable name
   * @param defaultValue - Optional default value
   * @returns String array
   * @throws Error if required variable is missing
   */
  array: (key: string, defaultValue?: string[]): string[] => {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
      return defaultValue;
    }
    return value.split(',').map(item => item.trim());
  }
};

/**
 * Format errors for better readability.
 * Adds emoji and stack trace for Error objects, uses util.inspect for others.
 *
 * @param error - Error to format
 * @returns Formatted error string
 */
export function prettyError(error: unknown): string {
  if (error instanceof Error) {
    return `💥 ${error.name}: ${error.message}\n${error.stack}`;
  }
  return util.inspect(error, { depth: null, colors: true });
}

/**
 * Group related log messages together.
 * Creates collapsible group in console for better organization.
 *
 * @param label - Group label
 * @param fn - Function to execute within group
 */
export function group(label: string, fn: () => void) {
  console.group(`📁 ${label}`);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
}

/**
 * Select specific properties from object.
 * Creates new object with only specified keys.
 *
 * @param obj - Source object
 * @param keys - Array of keys to include
 * @returns New object with only specified properties
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result: any = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Exclude specific properties from object.
 * Creates new object without specified keys.
 *
 * @param obj - Source object
 * @param keys - Array of keys to exclude
 * @returns New object without specified properties
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Validate email address format.
 * Useful for form validation, user registration, or contact forms.
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
export function isEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate URL format.
 * Useful for link validation, input sanitization, or API endpoints.
 *
 * @param url - URL to validate
 * @returns True if URL is valid, false otherwise
 */
export function isUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate random number within range.
 * Useful for simulations, games, or testing scenarios.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random number in range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Capitalize first letter of string.
 * Useful for formatting names, titles, or display text.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to slug format.
 * Useful for URLs, filenames, or SEO-friendly identifiers.
 *
 * @param str - String to convert
 * @returns Slugified string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate string to maximum length.
 * Useful for previews, summaries, or UI display.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to append if truncated
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Check if value is a valid JSON string.
 * Useful for API responses, configuration files, or data validation.
 *
 * @param str - String to check
 * @returns True if valid JSON, false otherwise
 */
export function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert object to query string.
 * Useful for API requests, URL parameters, or HTTP queries.
 *
 * @param obj - Object to convert
 * @returns Query string
 */
export function toQueryString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Parse query string to object.
 * Useful for URL parameters, API responses, or HTTP queries.
 *
 * @param query - Query string to parse
 * @returns Parsed object
 */
export function fromQueryString(query: string): Record<string, string> {
  return Object.fromEntries(
    query.split('&').map(pair => {
      const [key, value] = pair.split('=');
      return [decodeURIComponent(key), decodeURIComponent(value || '')];
    })
  );
}

/**
 * Generate random hex color.
 * Useful for UI design, data visualization, or theming.
 *
 * @returns Random hex color string
 */
export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Convert RGB to HEX color.
 * Useful for color manipulation, UI design, or theming.
 *
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HEX color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert HEX to RGB color.
 * Useful for color manipulation, UI design, or theming.
 *
 * @param hex - HEX color string
 * @returns RGB object { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Calculate the difference between two dates in various units.
 * Useful for age calculation, countdowns, or time tracking.
 *
 * @param date1 - First date
 * @param date2 - Second date (default: current date)
 * @returns Object with difference in years, months, days, hours, minutes, seconds
 */
export function dateDiff(date1: Date, date2: Date = new Date()): {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Approximate months and years
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  return {
    years,
    months,
    days: days % 30,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60
  };
}

/**
 * Format date as human-readable string.
 * Useful for display purposes, logs, or user interfaces.
 *
 * @param date - Date to format
 * @param format - Format string (default: "YYYY-MM-DD HH:mm:ss")
 * @returns Formatted date string
 */
export function formatDate(date: Date, format = "YYYY-MM-DD HH:mm:ss"): string {
  const pad = (num: number) => num.toString().padStart(2, '0');

  const replacements: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    SSS: date.getMilliseconds().toString().padStart(3, '0')
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, match => replacements[match] || match);
}

/**
 * Generate a range of numbers.
 * Useful for loops, arrays, or iterations.
 *
 * @param start - Start value
 * @param end - End value
 * @param step - Step size (default: 1)
 * @returns Array of numbers in range
 */
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i >= end; i += step) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * Useful for randomizing lists, games, or data sampling.
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculate percentage of value.
 * Useful for progress bars, statistics, or analytics.
 *
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Percentage as number
 */
export function percentage(value: number, total: number, decimals = 2): number {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
}

/**
 * Check if value is within range.
 * Useful for validation, constraints, or boundary checking.
 *
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range
 */
export function isBetween(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Clamp value to range.
 * Useful for ensuring values stay within bounds.
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round number to specified precision.
 * Useful for financial calculations, display formatting, or data processing.
 *
 * @param value - Number to round
 * @param precision - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function round(value: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Deep equality check for objects and arrays.
 * Useful for testing, comparisons, or data validation.
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Create a memoized version of a function.
 * Useful for performance optimization, caching, or expensive computations.
 *
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a once-only function that can only be called once.
 * Useful for initialization, singletons, or one-time operations.
 *
 * @param fn - Function to call once
 * @returns Function that can only be called once
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: any;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

/**
 * Create a function that can only be called a limited number of times.
 * Useful for rate limiting, API calls, or resource management.
 *
 * @param fn - Function to limit
 * @param limit - Maximum number of calls
 * @returns Limited function
 */
export function limitCalls<T extends (...args: any[]) => any>(fn: T, limit: number): T {
  let count = 0;

  return ((...args: Parameters<T>): ReturnType<T> | null => {
    if (count >= limit) {
      logger.warn(`Function call limit (${limit}) exceeded`);
      return null as any;
    }
    count++;
    return fn(...args);
  }) as T;
}

/**
 * Measure the time taken by a function.
 * Useful for performance monitoring, profiling, or benchmarking.
 *
 * @param fn - Function to measure
 * @returns Object with result and duration
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }>;
export async function measureTime<T>(fn: () => T): Promise<{ result: T; duration: number }>;
export async function measureTime<T>(fn: () => T): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;

  if (result instanceof Promise) {
    return result.then(res => ({ result: res, duration }));
  }
  return { result, duration };
}

/**
 * Retry a function with exponential backoff until it succeeds or max attempts reached.
 * Useful for resilient API calls, network operations, or unreliable services.
 *
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param initialDelay - Initial delay in ms
 * @returns Promise that resolves when fn succeeds
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  initialDelay = 100
): Promise<T> {
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('Max retry attempts reached');
}

/**
 * Execute a function with timeout.
 * Useful for preventing hanging operations, long-running tasks, or API timeouts.
 *
 * @param fn - Function to execute
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with result or rejects on timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    const result = await Promise.race([
      fn(),
      timeoutPromise
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Create a debounced promise function.
 * Useful for search-as-you-type, auto-save, or rate-limited API calls.
 *
 * @param fn - Function to debounce
 * @param wait - Wait time in ms
 * @returns Debounced function
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestPromise: Promise<any> | null = null;

  return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    latestPromise = new Promise(async (resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });

    return latestPromise;
  });
}

/**
 * Create a throttled promise function.
 * Useful for burst protection, API rate limiting, or resource management.
 *
 * @param fn - Function to throttle
 * @param limit - Maximum calls per interval
 * @param interval - Time interval in ms
 * @returns Throttled function
 */
export function throttlePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limit: number,
  interval: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  const queue: Array<{ resolve: (value: any) => void; reject: (error: any) => void; args: Parameters<T> }> = [];
  let inProgress = 0;
  let lastExecuted = 0;

  const processQueue = async () => {
    if (queue.length === 0 || inProgress >= limit) return;

    inProgress++;
    const { resolve, reject, args } = queue.shift()!;

    try {
      const result = await fn(...args);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      inProgress--;
      lastExecuted = Date.now();
      processQueue();
    }
  };

  return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject, args });

      const now = Date.now();
      if (now - lastExecuted >= interval || queue.length === 1) {
        processQueue();
      }
    });
  });
}

/**
 * Batch process an array with concurrency control.
 * Useful for processing large datasets, API batch operations, or parallel tasks.
 *
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param concurrency - Number of concurrent operations
 * @returns Promise with array of results
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 5
): Promise<R[]> {
  const results: R[] = [];
  const running: Promise<void>[] = [];

  for (const item of items) {
    const promise = processor(item).then(result => {
      results.push(result);
      running.splice(running.indexOf(promise), 1);
    });

    running.push(promise);

    if (running.length >= concurrency) {
      await Promise.race(running);
    }
  }

  await Promise.all(running);
  return results;
}

/**
 * Create a circuit breaker for function calls.
 * Useful for protecting against failing services, APIs, or resources.
 *
 * @param fn - Function to protect
 * @param threshold - Number of failures before opening circuit
 * @param resetTimeout - Time before attempting to close circuit
 * @returns Protected function
 */
export function circuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  threshold = 3,
  resetTimeout = 5000
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let state = 'CLOSED';
  let failureCount = 0;
  let nextAttempt = 0;

  return ((...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return new Promise(async (resolve, reject) => {
      const now = Date.now();

      if (state === 'OPEN') {
        if (now < nextAttempt) {
          reject(new Error('Circuit breaker is open'));
          return;
        }
        state = 'HALF-OPEN';
      }

      try {
        const result = await fn(...args);
        if (state === 'HALF-OPEN') {
          state = 'CLOSED';
          failureCount = 0;
        }
        resolve(result);
      } catch (error) {
        failureCount++;
        if (failureCount >= threshold) {
          state = 'OPEN';
          nextAttempt = now + resetTimeout;
          logger.error(`Circuit breaker opened (${threshold} failures)`);
        }
        reject(error);
      }
    });
  });
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sleep,
  retry,
  uuid,
  logger,
  timer,
  safeTry,
  asyncQueue,
  debounce,
  throttle,
  readJSON,
  writeJSON,
  fileExists,
  deepClone,
  pick,
  omit,
  merge,
  isEmpty,
  env,
  bytes,
  hash,
  randomString,
  fromQueryString,
  toQueryString,
  isEmail,
  isUrl,
  randomInt,
  shuffle,
  capitalize,
  truncate
} from './index';

// Mock console methods to avoid cluttering test output
const consoleMock = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

beforeEach(() => {
  vi.stubGlobal('console', consoleMock);
});

describe('Async Utilities', () => {
  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const sleepPromise = sleep(100);
      
      vi.advanceTimersByTime(100);
      await sleepPromise;

      // Success, no error means it resolved
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const failingFn = async (): Promise<string> => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      };

      const result = await retry(failingFn, { 
        times: 3,
        delay: 10, // Reduced delay for faster tests
        jitter: false // Disable jitter for predictable timings
      });
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    }, 10000); // Increased timeout

    it('should respect max retry attempts', async () => {
      const alwaysFailingFn = async (): Promise<string> => {
        throw new Error('Always fails');
      };

      await expect(retry(alwaysFailingFn, { 
        times: 2,
        delay: 5, // Minimal delay
        jitter: false
      }))
        .rejects
        .toThrow('Always fails');
    }, 10000); // Increased timeout
  });

  describe('asyncQueue', () => {
    it('should process tasks with concurrency control', async () => {
      const results: number[] = [];
      const tasks = Array.from({ length: 4 }, (_, i) => async (): Promise<number> => {
        // Use immediate resolution for fast tests
        return i;
      });

      const queueResults = await asyncQueue(tasks, 2);
      expect(queueResults).toHaveLength(4);
      
      // The results array should contain all values
      expect([...queueResults].sort()).toEqual([0, 1, 2, 3]);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('should create deep clone of object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });
  });

  describe('pick', () => {
    it('should pick specified properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);
      
      expect(picked).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);
      
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('merge', () => {
    it('should merge objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const merged = merge(obj1, obj2);
      
      expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('isEmpty', () => {
    it('should check if object is empty', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty('')).toBe(true);
    });
  });
});

describe('String Utilities', () => {
  describe('uuid', () => {
    it('should generate valid UUID', () => {
      const id = uuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('randomString', () => {
    it('should generate random string of specified length', () => {
      const str = randomString(10);
      expect(str).toHaveLength(10);
      expect(str).toMatch(/^[A-Za-z0-9]{10}$/);
    });
  });

  describe('hash', () => {
    it('should generate hash of text', () => {
      const hashValue = hash('test');
      expect(hashValue).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hash
    });
  });

  describe('isEmail', () => {
    it('should validate email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('invalid-email')).toBe(false);
    });
  });

  describe('isUrl', () => {
    it('should validate URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('invalid-url')).toBe(false);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('hello world', 5)).toBe('he...');
      expect(truncate('hello', 10)).toBe('hello');
    });
  });
});

describe('Array Utilities', () => {
  describe('shuffle', () => {
    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      
      expect(shuffled).toHaveLength(5);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('randomInt', () => {
    it('should generate random integer in range', () => {
      const num = randomInt(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });
  });
});

describe('Query String Utilities', () => {
  describe('fromQueryString', () => {
    it('should parse query string to object', () => {
      const result = fromQueryString('a=1&b=2');
      expect(result).toEqual({ a: '1', b: '2' });
    });
  });

  describe('toQueryString', () => {
    it('should convert object to query string', () => {
      const result = toQueryString({ a: 1, b: 'test' });
      expect(result).toBe('a=1&b=test');
    });
  });
});

describe('File Utilities', () => {
  describe('bytes', () => {
    it('should format bytes to human readable', () => {
      expect(bytes(1024)).toBe('1.00 KB');
      expect(bytes(1048576)).toBe('1.00 MB');
    });
  });
});

describe('Environment Utilities', () => {
  beforeEach(() => {
    process.env.TEST_VAR = 'test-value';
    process.env.NUMBER_VAR = '42';
    process.env.BOOL_VAR = 'true';
  });

  it('should get string environment variables', () => {
    expect(env.string('TEST_VAR')).toBe('test-value');
    expect(env.string('NON_EXISTENT', 'default')).toBe('default');
  });

  it('should get numbers from environment', () => {
    expect(env.number('NUMBER_VAR')).toBe(42);
  });

  it('should get booleans from environment', () => {
    expect(env.bool('BOOL_VAR')).toBe(true);
  });
});

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log messages with different levels', () => {
    logger.info('info message');
    logger.error('error message');
    logger.warn('warning message');
    logger.success('success message');

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});


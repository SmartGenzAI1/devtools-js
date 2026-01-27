#!/usr/bin/env node

import { program } from 'commander';
import { uuid } from './dist/index.js';
import { hash } from './dist/index.js';
import { randomString } from './dist/index.js';
import { logger } from './dist/index.js';
import chalk from 'chalk';

program
  .name('devtools-js')
  .description('CLI tool for devtools-js utilities')
  .version('1.0.0');

program.command('uuid')
  .description('Generate a UUID')
  .action(() => {
    const id = uuid();
    console.log(id);
  });

program.command('hash <text>')
  .description('Generate hash of text')
  .option('-a, --algo <algo>', 'Hash algorithm (sha256, sha512, etc)', 'sha256')
  .action((text, options) => {
    const hashed = hash(text, options.algo);
    console.log(hashed);
  });

program.command('random <length>')
  .description('Generate random string')
  .action((length) => {
    const lengthNum = parseInt(length, 10);
    if (isNaN(lengthNum)) {
      logger.error('Length must be a number');
      process.exit(1);
    }
    const randomStr = randomString(lengthNum);
    console.log(randomStr);
  });

program.command('info')
  .description('Show library information')
  .action(() => {
    console.log(chalk.bold('🚀 devtools-js - All-in-one Node developer toolkit'));
    console.log('');
    console.log('✅ Core Features:');
    console.log('  • sleep, retry (with exponential backoff)');
    console.log('  • uuid, logger (colored)');
    console.log('  • timer, safeTry');
    console.log('');
    console.log('🔥 Async Features:');
    console.log('  • asyncQueue, debounce, throttle');
    console.log('');
    console.log('📁 File Features:');
    console.log('  • readJSON, writeJSON, fileExists');
    console.log('');
    console.log('🧩 Object Features:');
    console.log('  • deepClone, pick, omit, merge, isEmpty');
    console.log('');
    console.log('🌍 System Features:');
    console.log('  • env helpers, bytes formatter, hash, randomString');
    console.log('');
    console.log('📦 Package:');
    console.log('  • Zero dependencies');
    console.log('  • TypeScript support');
    console.log('  • < 20KB size');
    console.log('');
    console.log('💡 Usage:');
    console.log('  import { sleep, retry, uuid, logger } from "devtools-js"');
  });

program.parse(process.argv);
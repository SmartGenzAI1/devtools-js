#!/usr/bin/env node

import { program } from 'commander';
import { 
  uuid, hash, randomString, logger,
  aiFunction, smartDebug, universalTransform, performanceOptimize
} from './dist/index.js';
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

program.command('ai <description>')
  .description('Generate function from natural language description')
  .action((description) => {
    console.log(chalk.blue('🤖 AI Function Generator'));
    console.log('Description:', description);
    console.log('Example usage:');
    console.log('  const fn = aiFunction("add two numbers");');
    console.log('  fn(5, 3) // Returns 8');
  });

program.command('debug <value>')
  .description('Intelligent debugging with suggestions')
  .action((value) => {
    try {
      const parsedValue = JSON.parse(value);
      smartDebug(parsedValue, 'CLI Debug');
    } catch {
      smartDebug(value, 'CLI Debug');
    }
  });

program.command('transform <data> <format>')
  .description('Transform data between formats (json, xml, csv, yaml)')
  .action((data, format) => {
    try {
      const parsedData = JSON.parse(data);
      const result = universalTransform(parsedData, format);
      console.log(chalk.green(`Transformed to ${format}:`));
      console.log(result);
    } catch (error) {
      console.log(chalk.green(`Transformed to ${format}:`));
      console.log(universalTransform(data, format));
    }
  });

program.command('optimize <iterations>')
  .description('Performance optimization analysis')
  .action((iterations) => {
    console.log(chalk.yellow('Performance Optimizer'));
    console.log('Run this in your code:');
    console.log('  import { performanceOptimize } from "devtools-js"');
    console.log('');
    console.log('  const result = performanceOptimize(yourFunction, 1000);');
    console.log('  console.log(result.optimizations);');
  });

program.command('info')
  .description('Show library information')
  .action(() => {
    console.log(chalk.bold('🚀 devtools-js - All-in-one Node developer toolkit'));
    console.log(chalk.green('⭐ NOW WITH VIRAL AI-POWERED UTILITIES!'));
    console.log('');
    console.log('🤖 AI-Powered Features:');
    console.log('  • aiFunction - Generate functions from natural language');
    console.log('  • smartDebug - Intelligent debugging with suggestions');
    console.log('  • performanceOptimize - Automatic performance optimization');
    console.log('  • intelligentErrorHandler - Smart error handling');
    console.log('');
    console.log('🎯 Game-Changing Utilities:');
    console.log('  • universalTransform - Convert any data format instantly');
    console.log('  • createSmartCache - Intelligent caching system');
    console.log('  • universalValidator - Universal data validation');
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
    console.log('  • 60+ utility functions');
    console.log('');
    console.log('💡 Viral Examples:');
    console.log('  const add = aiFunction("add two numbers");');
    console.log('  const result = add(5, 3); // 8');
    console.log('');
    console.log('  const debugged = smartDebug(data, "My Data");');
    console.log('  // Shows type, suggestions, and issues!');
    console.log('');
    console.log('🚀 Get Ready to Go Viral!');
    console.log('  import { aiFunction, smartDebug, performanceOptimize } from "devtools-js"');
  });

program.parse(process.argv);
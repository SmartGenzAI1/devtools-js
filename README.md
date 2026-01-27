

---


---
## 🥇 ##


# 🚀 devtools-js

> Tiny, zero-dependency utility helpers for Node.js developers.

Stop rewriting the same small functions in every project.

`devtools-js` provides simple, clean, battle-tested utilities like sleep, retry, logger, uuid, debounce, JSON helpers, and more.

Lightweight. Fast. No dependencies.

---

## ✨ Features

- ✅ Zero dependencies
- ✅ Tiny & fast
- ✅ Works in Node.js & Bun
- ✅ Beginner friendly
- ✅ Tree-shakable
- ✅ TypeScript support

---

## 📦 Installation

```bash
npm install devtools-js


---

🔧 Usage

import {
  sleep,
  retry,
  uuid,
  readJSON,
  writeJSON,
  logger
} from "devtools-js"


---

📚 Examples

Sleep

await sleep(1000)


---

Retry

await retry(async () => fetchData(), 3)


---

UUID

const id = uuid()


---

JSON Helpers

const config = await readJSON("config.json")
await writeJSON("config.json", config)


---

Logger

logger.info("Server started")
logger.success("Done")
logger.error("Something failed")


---

📁 Functions Included

sleep(ms)

retry(fn, times)

uuid()

debounce(fn)

throttle(fn)

deepClone(obj)

readJSON(path)

writeJSON(path, data)

fileExists(path)

logger()

randomString(len)

timer()


(More coming soon — PRs welcome!)


---

🎯 Why?

Every project re-implements these small helpers.

Instead of copying code again and again, install once.


---

🤝 Contributing

Contributions are welcome!

Ideas:

new small utilities

performance improvements

bug fixes

TypeScript types


git clone repo
npm install
npm test


---

🧠 Philosophy

Small. Simple. Useful. No bloat.


---

⭐ Support

If this saves you time, consider starring the repo!


---

📄 License

MIT

---

---

# 🥈 Project 2 — pretty-log

Copy → `README.md`

```markdown
# 🎨 pretty-log

> Beautiful, colorful logging for Node.js CLI apps.

Make your terminal output clean and professional in seconds.

Perfect for CLIs, scripts, tools, and automation.

---

## ✨ Features

- ✅ Colored logs
- ✅ Success / error / warn styles
- ✅ Spinners
- ✅ Tables
- ✅ Timers
- ✅ Zero dependencies
- ✅ Lightweight

---

## 📦 Installation

```bash
npm install pretty-log


---

🔧 Usage

import log from "pretty-log"


---

📚 Examples

Basic logs

log.info("Starting...")
log.success("Done")
log.warn("Careful")
log.error("Failed")

Output:

ℹ Starting...
✔ Done
⚠ Careful
✖ Failed


---

Spinner

const spinner = log.spinner("Loading...")
spinner.start()

setTimeout(() => spinner.stop("Finished"), 2000)


---

Table

log.table([
  { name: "Alice", score: 95 },
  { name: "Bob", score: 88 }
])


---

Timer

const end = log.time("Build")
// work
end()


---

🎯 Why?

Console logs look messy by default.

pretty-log makes your tools look professional instantly.


---

🧩 Perfect for

CLI tools

Build scripts

Dev tools

Automation scripts

Node utilities



---

🤝 Contributing

Add new features like:

progress bars

prompts

better themes

custom colors


PRs welcome!


---

⭐ Support

If you like it, give the repo a star!


---

📄 License

MIT

---

---

# 🥉 Project 3 — file-easy

Copy → `README.md`

```markdown
# 📁 file-easy

> Simple file system utilities for Node.js.

Working with files in Node.js is verbose and annoying.

`file-easy` makes it clean and simple.

---

## ✨ Features

- ✅ Promise based
- ✅ Simple API
- ✅ Safe operations
- ✅ Zero dependencies
- ✅ Lightweight

---

## 📦 Installation

```bash
npm install file-easy


---

🔧 Usage

import {
  readJSON,
  writeJSON,
  copy,
  move,
  remove,
  findFiles,
  exists
} from "file-easy"


---

📚 Examples

Read JSON

const config = await readJSON("config.json")


---

Write JSON

await writeJSON("config.json", { port: 3000 })


---

Copy

await copy("src", "backup/src")


---

Move

await move("a.txt", "archive/a.txt")


---

Delete safely

await remove("temp")


---

Find files

const files = await findFiles("src", ".js")


---

🎯 Why?

Node's fs module is low-level.

This library gives you:

fewer lines

cleaner code

safer defaults



---

🧩 Perfect for

scripts

build tools

CLI apps

automation

backend projects



---

🤝 Contributing

Ideas:

zip/unzip

file watching

hashing

directory size

caching


All contributions welcome.


---

⭐ Support

Star the repo if it helps you!


---

📄 License

MIT

---

---

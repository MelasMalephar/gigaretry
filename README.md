# gigaretry

> Retry any function — HTTP, DB, async, sync — with ease.  
> Smart retries made simple.

[![Buy Me a Coffee](https://img.shields.io/badge/-Buy%20me%20a%20coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/devnamit)

---

## 🚀 Features

- 🔁 Retry *any* sync or async function
- ⏱️ Custom delay between retries
- 🎯 Set max attempts
- 📄 Optional logging
- 🧠 Minimal code, maximal flexibility

---

## 📦 Installation

```bash
npm install gigaretry
✨ Usage
js
Copy
Edit
const { retryOperation } = require('gigaretry');

let count = 0;
async function unreliableTask() {
  count++;
  if (count < 3) throw new Error("Temporary failure");
  return "Success!";
}

(async () => {
  const result = await retryOperation(unreliableTask, [], {
    attempts: 5,
    delay: 1000,
    log: true
  });
  console.log(result); // "Success!"
})();
🔧 Options
Option	Type	Default	Description
attempts	Number	3	Maximum retry attempts
delay	Number	1000	Delay between retries (in ms)
log	Boolean	false	Log retry attempts to the console

✅ Testing
Tests are written using Jest.

npm install
npm test


📁 Project Structure

.
├── src/
│   └── index.js         // Core retry logic
├── test/
│   └── index.test.js    // Jest tests
├── .npmignore
├── package.json
└── README.md


🙋‍♂️ About the Author
Hey, I’m Namit Sharma — a backend engineer who enjoys building tiny tools that solve big annoyances.

I built gigaretry because most retry modules are tied to HTTP or overly complex. I wanted something simple, universal, and robust. If it helped you avoid a headache (or three), you can:

👉 Buy me a coffee — it keeps the side-project fire alive ☕

📜 License
Apache-2.0 © Namit Sharma


# gigaretry

> Retry any function — HTTP, DB, async, sync — with ease.  
> Smart retries made simple. Now with **child process isolation**.

[![Buy Me a Coffee](https://img.shields.io/badge/-Buy%20me%20a%20coffee-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/devnamit)

---

## 🚀 Features

- 🔁 Retry *any* sync or async function
- 🔒 **NEW**: Child process isolation for better error handling
- ⏱️ Custom delay with exponential backoff support
- 🎯 Set max attempts and timeout limits
- 📄 Optional logging
- 🧠 Minimal code, maximal flexibility
- 🛡️ Process isolation prevents memory leaks and crashes

---

## 📦 Installation

```bash
npm install gigaretry
```

---

## ✨ Usage

### Basic Retry

```javascript
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
```

### Child Process Isolation

```javascript
const { retryOperation } = require('gigaretry');
const axios = require('axios');

// Run in isolated child process - perfect for unreliable APIs
const userData = await retryOperation(
  async (userId) => {
    const response = await axios.get(`https://api.example.com/users/${userId}`);
    return response.data;
  },
  ['123'],
  {
    attempts: 5,
    delay: 1000,
    childProcess: true, // 🔒 Runs in isolated process
    exponential: true,  // 📈 Exponential backoff
    maxTimeout: 30000,  // 🕐 Max 30s delay
    log: true
  }
);
```

### Exponential Backoff

```javascript
// Delays: 1s → 2s → 4s → 8s → 16s (capped at maxTimeout)
const result = await retryOperation(flakyFunction, [], {
  attempts: 5,
  delay: 1000,
  exponential: true,
  maxTimeout: 10000 // Cap at 10 seconds
});
```

---

## 🔧 Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `attempts` | Number | `3` | Maximum retry attempts |
| `delay` | Number | `1000` | Delay between retries (in ms) |
| `exponential` | Boolean | `false` | Use exponential backoff |
| `maxTimeout` | Number | `10000` | Maximum delay when using exponential backoff |
| `childProcess` | Boolean | `false` | **NEW**: Run function in isolated child process |
| `log` | Boolean | `false` | Log retry attempts to the console |

---

## 🔒 Child Process Benefits

Running functions in child processes provides several advantages:

- **Memory Isolation**: Prevents memory leaks from affecting your main process
- **Crash Protection**: Function crashes won't bring down your main application
- **Resource Limits**: Better control over resource usage per operation
- **Clean Environment**: Each retry starts with a fresh process state

Perfect for:
- Unreliable third-party APIs
- Memory-intensive operations
- Functions that might crash or hang
- Operations requiring clean state between retries

---

## 🧪 Real-World Examples

### Database Operations

```javascript
const { retryOperation } = require('gigaretry');

// Retry database connection with exponential backoff
const dbResult = await retryOperation(
  async () => {
    const connection = await database.connect();
    return await connection.query('SELECT * FROM users');
  },
  [],
  {
    attempts: 5,
    delay: 500,
    exponential: true,
    log: true
  }
);
```

### File Operations

```javascript
// Retry file operations in child process
const fileData = await retryOperation(
  async (filePath) => {
    const fs = require('fs').promises;
    return await fs.readFile(filePath, 'utf8');
  },
  ['/path/to/important/file.txt'],
  {
    attempts: 3,
    delay: 1000,
    childProcess: true
  }
);
```

### HTTP Requests with Complex Logic

```javascript
const complexApiCall = await retryOperation(
  async (endpoint, payload) => {
    const axios = require('axios');
    
    // Complex authentication and request logic
    const authToken = await getAuthToken();
    const response = await axios.post(endpoint, payload, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`API returned ${response.status}`);
    }
    
    return response.data;
  },
  ['https://api.example.com/complex', { data: 'important' }],
  {
    attempts: 8,
    delay: 2000,
    exponential: true,
    maxTimeout: 60000,
    childProcess: true, // Isolate this complex operation
    log: true
  }
);
```

---

## ✅ Testing

Tests are written using Jest and cover both regular and child process operations.

```bash
npm install
npm test
```

---

## 📁 Project Structure

```
.
├── src/
│   ├── index.js         // Core retry logic
│   └── childRetry.js    // Child process handler
├── test/
│   └── retry.test.js    // Jest tests
├── .npmignore
├── package.json
├── CHANGELOG.md
└── README.md
```

---

## 🔄 Migration from v1.x

gigaretry v2.0 is backward compatible. Existing code will work unchanged:

```javascript
// v1.x code works exactly the same in v2.x
const result = await retryOperation(myFunction, [], {
  attempts: 3,
  delay: 1000,
  log: true
});
```

New features are opt-in:

```javascript
// v2.x - Add new features as needed
const result = await retryOperation(myFunction, [], {
  attempts: 3,
  delay: 1000,
  log: true,
  childProcess: true,  // NEW: opt-in feature
  exponential: true    // NEW: opt-in feature
});
```

---

## 🙋‍♂️ About the Author

Hey, I'm Namit Sharma — a backend engineer who enjoys building tiny tools that solve big annoyances.

I built gigaretry because most retry modules are tied to HTTP or overly complex. I wanted something simple, universal, and robust. The new child process feature came from real-world experience with unreliable APIs that would occasionally crash entire applications.

If it helped you avoid a headache (or three), you can:

👉 [Buy me a coffee](https://buymeacoffee.com/devnamit) — it keeps the side-project fire alive ☕

---

## 📜 License

Apache-2.0 © Namit Sharma
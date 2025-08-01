const { spawn } = require('child_process');
const path = require('path');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation, args = [], options = {}) {
  const {
    attempts = 3,
    delay = 1000,
    exponential = false,
    maxTimeout = 10000,
    log = false,
    childProcess = false
  } = options;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (childProcess) {
        return await runInChild(operation.name, args);
      }
      return await operation(...args);
    } catch (err) {
      if (log) {
        console.error(`Attempt ${attempt} failed: ${err.message}`);
      }
      if (attempt === attempts) throw err;
      let currentDelay = exponential
        ? Math.min(delay * Math.pow(2, attempt - 1), maxTimeout)
        : delay;
      await wait(currentDelay);
    }
  }
}

function runInChild(functionName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.resolve(__dirname, 'childRetry.js'), functionName, ...args]);

    let output = '';
    child.stdout.on('data', data => (output += data));
    child.stderr.on('data', err => reject(new Error(err.toString())));

    child.on('close', code => {
      if (code !== 0) reject(new Error(`Child process exited with code ${code}`));
      else resolve(output.trim());
    });
  });
}

module.exports = { retryOperation };

// index.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retryOperation(operation, args = [], options = {}) {
  const {
    attempts = 3,
    delay = 1000,
    exponential = false,
    maxTimeout = 10000,
    log = false,
    childProcess = false,
  } = options;

  const retryLogic = async () => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        if (childProcess) {
          // Serialize the function and pass it to child process
          return await runInChild(operation, args, log);
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
  };

  return retryLogic();
}

function runInChild(operation, args = [],enableLog = false) {
  return new Promise((resolve, reject) => {
    // Create a temporary function data object
    const functionData = {
      code: operation.toString(),
      args: args
    };

    // Create temp file in OS temp directory to avoid path issues
    const tempFile = path.join(os.tmpdir(), `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`);
    
    try {
      fs.writeFileSync(tempFile, JSON.stringify(functionData, null, 2));
    } catch (err) {
      reject(new Error(`Failed to write temp file: ${err.message}`));
      return;
    }

    const childScript = path.join(__dirname, 'childRetry.js');

    const child = spawn('node', [childScript, tempFile], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', data => {
      output += data.toString();
    });

    child.stderr.on('data', err => {
      errorOutput += err.toString();
    });

    child.on('close', code => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (enableLog) {
        console.log('Child process closed with code:', code);
        console.log('Output:', output);
        console.log('Error output:', errorOutput);
      }
      
      if (code !== 0) {
        reject(new Error(`Child process failed: ${errorOutput || `Exit code ${code}`}`));
      } else {
        try {
          const trimmedOutput = output.trim();
          if (!trimmedOutput) {
            reject(new Error('Child process returned empty output'));
            return;
          }
          
          try {
            const result = JSON.parse(trimmedOutput);
            resolve(result);
          } catch {
            resolve(trimmedOutput);
          }
        } catch (err) {
          reject(new Error(`Failed to process child output: ${err.message}`));
        }
      }
    });

    child.on('error', err => {
      // Clean up temp file on error
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      reject(new Error(`Failed to spawn child process: ${err.message}`));
    });
  });
}

module.exports = {
  retryOperation,
  runInChild
};
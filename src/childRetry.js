const fs = require('fs');
const path = require('path');

// Get the temp file path from command line argument
const tempFilePath = process.argv[2];

(async () => {
  try {
    if (!tempFilePath) {
      throw new Error('No temp file path provided');
    }

    // Check if file exists
    if (!fs.existsSync(tempFilePath)) {
      throw new Error(`Temp file does not exist: ${tempFilePath}`);
    }

    // Read function data from temp file
    const functionDataJson = fs.readFileSync(tempFilePath, 'utf8');
    const functionData = JSON.parse(functionDataJson);
    const { code, args } = functionData;

    // Execute the function
    const result = await executeFunction(code, args);

    // Output the result to stdout
    if (result !== undefined && result !== null) {
      if (typeof result === 'object') {
        console.log(JSON.stringify(result));
      } else {
        console.log(String(result));
      }
    } else {
      console.log('null');
    }

  } catch (err) {
    console.error(`Child process error: ${err.message || err}`);
    process.exit(1);
  }
})();

async function executeFunction(code, args) {
  try {
    // Create the function using eval in an async context
    const result = await (async () => {
      const fn = eval(`(${code})`);
      return await fn(...args);
    })();

    return result;
  } catch (error) {
    throw new Error(`Function execution failed: ${error.message}`);
  }
}
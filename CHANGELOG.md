# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** If your retried function depends on external libraries (e.g., `axios`), those libraries must be explicitly imported or available in the child process context. Only built-in Node.js modules are available by default in child processes.

## [2.0.0] - 2025-08-02

### Added
- **Child Process Support**: New `childProcess` option to run retry operations in isolated Node.js child processes
- **Process Isolation**: Functions can now run in separate processes for better error isolation and memory management
- **Enhanced Error Handling**: Improved error messages and debugging capabilities for child process operations
- **Exponential Backoff**: New `exponential` option for exponential delay between retries
- **Max Timeout**: New `maxTimeout` option to cap the maximum delay when using exponential backoff
- **Function Serialization**: Automatic serialization and deserialization of functions and their results across process boundaries
- **Script Module Testing**: Added support and tests for running retry operations with ECMAScript modules (`.mjs`/`type: module`), ensuring compatibility with both CommonJS and ESM environments

### Enhanced
- **Better Error Propagation**: Child processes properly propagate errors back to parent process
- **Improved Testing**: Comprehensive test suite covering both regular and child process operations, including script module scenarios
- **Temporary File Management**: Secure temporary file handling for inter-process communication
- **Cross-Platform Compatibility**: Enhanced compatibility across different operating systems

### Technical Details
- Functions are serialized using `toString()` and executed in child processes using `eval`
- Communication between parent and child processes uses temporary JSON files
- Child processes have access to common Node.js modules (fs, path, etc.)
- Automatic cleanup of temporary files after operation completion
- Script module support is detected and handled, allowing retry operations to work seamlessly in ESM projects

### Breaking Changes
- Minimum Node.js version requirement may have changed due to child process dependencies

### Example Usage
```javascript
// Run HTTP requests in child process for better isolation
const result = await retryOperation(
  async (url) => {
    const response = await axios.get(url);
    return response.data;
  },
  ['https://api.example.com/data'],
  {
    attempts: 5,
    delay: 1000,
    childProcess: true, // New option
    exponential: true,  // New option
    maxTimeout: 30000   // New option
  }
);
```

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of gigaretry
- Basic retry functionality for sync and async functions
- Configurable retry attempts and delay
- Optional logging support
- Universal function retry capability

### Features
- `retryOperation(fn, args, options)` main function
- Support for both synchronous and asynchronous functions
- Customizable retry attempts (default: 3)
- Configurable delay between retries (default: 1000ms)
- Optional console logging of retry attempts
- Simple and intuitive API

### Example Usage
```javascript
const { retryOperation } = require('gigaretry');

const result = await retryOperation(unreliableFunction, [], {
  attempts: 3,
  delay: 1000,
  log: true
});
```
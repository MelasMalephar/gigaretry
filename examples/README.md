# 🚀 gigaretry Examples

This folder contains practical examples of how to use gigaretry in different scenarios.

## 📁 Files

- **`basic-usage.ts`** - Simple retry examples with TypeScript
- **`child-process.ts`** - Advanced examples using child process isolation
- **`typescript-examples.ts`** - Comprehensive TypeScript usage patterns

## 🚀 Running Examples

### Prerequisites
```bash
npm install gigaretry
npm install -g ts-node  # For running TypeScript directly
```

### Run Examples
```bash
# Basic usage examples
ts-node examples/basic-usage.ts

# Child process examples  
ts-node examples/child-process.ts

# All TypeScript patterns
ts-node examples/typescript-examples.ts
```

### For JavaScript Projects
If you're using JavaScript instead of TypeScript, you can adapt these examples by:

1. Removing type annotations: `(userId: string)` → `(userId)`
2. Removing interface definitions
3. Using `.js` extension instead of `.ts`

## 📚 Example Categories

### 🔄 Basic Retry
- Simple function retry
- Functions with arguments
- Custom retry options

### 🔒 Child Process Isolation
- API calls in isolated processes
- Heavy computations
- Database operations
- Memory-intensive tasks

### 📈 Exponential Backoff
- Smart delay scaling
- Timeout limits
- High-frequency retry scenarios

### 🔷 TypeScript Features
- Generic type support
- Interface definitions
- Type-safe error handling
- IntelliSense support

## 💡 Tips

1. **Child Processes**: Use for operations that might crash or consume lots of memory
2. **Exponential Backoff**: Use for external APIs to avoid overwhelming servers
3. **TypeScript**: Leverage type safety for complex data structures
4. **Logging**: Enable `log: true` during development for debugging

## 🤝 Contributing Examples

Have a great use case? Feel free to contribute more examples by submitting a PR!
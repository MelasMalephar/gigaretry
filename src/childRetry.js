const functions = {
  example: (x, y) => {
    if (Math.random() < 0.7) throw new Error("Random failure");
    return x + y;
  }
};

(async () => {
  const [,, fnName, ...rawArgs] = process.argv;
  const args = rawArgs.map(arg => {
    try {
      return JSON.parse(arg);
    } catch {
      return arg;
    }
  });

  try {
    const result = await functions[fnName](...args);
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();

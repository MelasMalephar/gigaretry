// jest.config.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest', // TS files
    '^.+\\.js$': 'babel-jest' // JS files (optional, see note below)
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
    }]
  ]
  // Optional: add global setup/teardown if needed later
};

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  verbose: true,
  testTimeout: 30000,
  maxWorkers: 1,
};

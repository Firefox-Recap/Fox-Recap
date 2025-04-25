/* eslint-env node */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['fake-indexeddb/auto'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './.babelrc' }],
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js'],
};
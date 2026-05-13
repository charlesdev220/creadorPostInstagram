import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleNameMapper: {
    '^@core/(.*)$':     '<rootDir>/src/app/core/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@models/(.*)$':   '<rootDir>/src/app/core/models/$1',
    '^@env/(.*)$':      '<rootDir>/src/environments/$1',
    '^@test/(.*)$':     '<rootDir>/src/app/test/$1',
    // Shim: @angular/platform-browser-dynamic fue eliminado en Angular 20.
    // Spectator@22 y jest-preset-angular@16 lo siguen requiriendo internamente.
    '^@angular/platform-browser-dynamic/testing$':
      '<rootDir>/src/__mocks__/platform-browser-dynamic-testing.js',
    '^@angular/platform-browser-dynamic$':
      '<rootDir>/src/__mocks__/platform-browser-dynamic-testing.js',
  },
  testMatch: ['<rootDir>/src/app/test/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/test/**',
  ],
};

export default config;

import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const baseConfig: Config = {
  testEnvironment: '<rootDir>/jest.environment.js',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'require', 'default'],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

// MSW v2 has a deep tree of ESM-only transitive deps in the pnpm store.
// Rather than maintaining an ever-growing allowlist, we replace all of
// next/jest's transformIgnorePatterns with a single rule that only skips
// CSS Modules. SWC transforms everything else (fast enough for a test suite).
const getConfig = createJestConfig(baseConfig);

export default async function jestConfig () {
  const cfg = await getConfig();
  cfg.transformIgnorePatterns = ['^.+\\.module\\.(css|sass|scss)$'];
  return cfg;
};

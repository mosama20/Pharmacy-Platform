import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.dto.(t|j)s',
    '!**/*.module.(t|j)s',
    '!main.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  verbose: true,
};

export default config;

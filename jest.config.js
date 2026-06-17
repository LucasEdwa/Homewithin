/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'services/**/*.ts',
    'constants/**/*.ts',
    'context/**/*.tsx',
    'components/**/*.tsx',
    'app/**/*.tsx',
    '!**/_layout.tsx',
  ],
  moduleDirectories: ['node_modules', 'node_modules/expo/node_modules'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@supabase)',
  ],
};

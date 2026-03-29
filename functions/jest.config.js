module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^firebase-admin$': '<rootDir>/src/__mocks__/firebase-admin.ts',
    '^firebase-functions/v2/https$': '<rootDir>/src/__mocks__/firebase-functions-https.ts',
    '^firebase-functions/v2/firestore$': '<rootDir>/src/__mocks__/firebase-functions-firestore.ts',
    '^resend$': '<rootDir>/src/__mocks__/resend.ts',
  },
}

const firestoreMock = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  runTransaction: jest.fn(),
}

const admin = {
  apps: [] as any[],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => firestoreMock), {
    FieldValue: {
      serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
      increment: jest.fn((n: number) => ({ _increment: n })),
    },
  }),
}

export default admin
export const __firestoreMock = firestoreMock

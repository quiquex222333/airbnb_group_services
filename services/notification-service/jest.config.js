module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ['<rootDir>/../../tests/notification-service'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

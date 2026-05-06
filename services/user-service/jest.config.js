module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ['<rootDir>/../../tests/user-service'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};

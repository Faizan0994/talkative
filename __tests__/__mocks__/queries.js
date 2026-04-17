// Mock database queries module
const mockQueries = {
  createUser: jest.fn(),
  getUserByName: jest.fn(),
  saveRefreshToken: jest.fn(),
  getToken: jest.fn(),
  revokeToken: jest.fn(),
};

module.exports = mockQueries;

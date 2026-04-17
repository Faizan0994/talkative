# Test Documentation

This directory contains test scripts for the authentication routes and controllers.

## Test Structure

```
__tests__/
├── setup.js                    # Test environment setup
├── __mocks__/
│   └── queries.js             # Mock database queries
├── auth.controller.test.js    # Unit tests for auth controller
└── auth.routes.test.js        # Integration tests for auth routes
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

## Test Coverage

### Auth Routes Integration Tests (`auth.routes.test.js`)

Tests the following endpoints with various scenarios:

#### POST /api/auth/signup

- ✅ Successfully register a new user
- ✅ Reject signup with invalid name (contains numbers)
- ✅ Reject signup with short name
- ✅ Reject signup with short username
- ✅ Reject signup with short password
- ✅ Reject signup when passwords do not match
- ✅ Reject signup without profile picture URL
- ✅ Reject signup with already taken username

#### POST /api/auth/login

- ✅ Successfully login with valid credentials
- ✅ Reject login with invalid username
- ✅ Reject login with incorrect password
- ✅ Reject login with username too long
- ✅ Verify JWT token and refresh token are returned
- ✅ Verify refresh token is stored as httpOnly cookie

#### POST /api/auth/refresh

- ✅ Successfully refresh access token with valid refresh token
- ✅ Reject refresh without refresh token
- ✅ Reject refresh with revoked token
- ✅ Reject refresh with non-existent token

#### POST /api/auth/logout

- ✅ Successfully logout with valid tokens
- ✅ Reject logout without access token
- ✅ Reject logout with invalid access token
- ✅ Verify refresh token is revoked

### Auth Controller Unit Tests (`auth.controller.test.js`)

Tests the following functionality:

#### Token Creation

- ✅ Create valid access token
- ✅ Create valid refresh token
- ✅ Verify token payload

#### Password Hashing

- ✅ Hash password correctly
- ✅ Verify correct password
- ✅ Reject incorrect password

#### Token Verification Middleware

- ✅ Accept valid token
- ✅ Reject request without token
- ✅ Reject invalid token
- ✅ Reject expired token

#### Token Hashing (HMAC)

- ✅ Consistently hash the same token
- ✅ Produce different hashes for different tokens

#### Database Queries Integration

- ✅ Call createUser with correct parameters
- ✅ Call getUserByName with correct parameter
- ✅ Call saveRefreshToken with correct parameters
- ✅ Call getToken with correct parameter
- ✅ Call revokeToken with correct parameter

## Environment Variables Required

The tests use mock environment variables defined in `__tests__/setup.js`:

- `ACCESS_SECRET` - JWT secret for access tokens
- `REFRESH_SECRET` - JWT secret for refresh tokens
- `REFRESH_HASH_SECRET` - HMAC secret for hashing refresh tokens
- `NODE_ENV` - Set to 'test'

For production, ensure these are set in your `.env` file.

## Mocking

The tests mock the database queries module (`lib/queries.js`) to avoid hitting the actual database during tests. All database operations are mocked using Jest's mocking functionality.

## Test Utilities

- **Jest**: Test framework
- **Supertest**: HTTP assertion library for testing Express routes
- **bcryptjs**: For password hashing verification
- **jsonwebtoken**: For JWT token creation and verification

## Notes

- Tests do not require a running database
- Tests use isolated Express app instances
- Each test resets all mocks to ensure isolation
- Integration tests test the full request/response cycle
- Unit tests focus on individual functions and middleware

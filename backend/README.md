# Backend API Documentation

A TypeScript/Fastify backend with JWT authentication, Prisma ORM, and comprehensive error handling.

## 🏗 Architecture

### Domain-Driven Structure

```
backend/
├── controllers/rest-api/     # HTTP layer
│   ├── plugins/             # Fastify plugins (auth, config, error handling)
│   ├── routes/              # API route definitions
│   ├── index.ts            # Server entry point
│   └── server.ts           # Fastify server setup
├── domain/                 # Business logic layer
│   ├── auth/               # Authentication domain
│   │   ├── repository.ts   # Auth business logic
│   │   └── schema.ts       # Auth validation schemas
│   └── user/              # User domain
│       ├── repository.ts   # User data operations
│       └── schema.ts       # User type definitions
├── utils/                 # Shared utilities
│   ├── db.ts             # Prisma database client
│   ├── errors.ts         # Error handling system
│   └── jwt.ts            # JWT utilities
└── prisma/               # Database layer
    └── schema.prisma     # Database schema
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. Clone and navigate to backend:
   ```bash
   cd backend
   npm install
   ```

2. Environment setup:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   JWT_SECRET="your-super-secret-jwt-key"
   API_HOST=0.0.0.0
   API_PORT=8080
   ```

3. Database setup:
   ```bash
   npm run db:push       # Create database schema
   npm run db:generate   # Generate Prisma client
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:8080`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | `/auth/register` | Create new account | No |
| POST   | `/auth/login` | User login | No |
| GET    | `/auth/me` | Get current user | Yes |
| PUT    | `/auth/profile` | Update profile | Yes |
| PUT    | `/auth/password` | Change password | Yes |
| GET    | `/auth/health` | Service health check | No |

### Example Requests

**Register:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "passwordConfirmation": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer your-jwt-token"
```

## 🎯 Key Features

### 1. Comprehensive Error Handling

The error system provides consistent, user-friendly error responses:

```typescript
// Custom error factory
throw ErrorFactory.userAlreadyExists();
throw ErrorFactory.invalidCredentials();
throw ErrorFactory.validationFailed({ field: 'email', message: 'Invalid email' });
```

**Error Response Format:**
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

### 2. Type-Safe Validation

Using TypeBox for runtime validation:

```typescript
const RegisterBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 50 }),
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 }),
  passwordConfirmation: Type.String({ minLength: 6 }),
});
```

### 3. JWT Authentication

Secure JWT implementation with:
- Token generation and verification
- Middleware for protected routes
- Automatic token validation

### 4. Database Integration

Prisma ORM with:
- Type-safe database queries
- Automatic migrations
- Connection pooling

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `JWT_SECRET` | Secret for JWT signing | - | Yes |
| `API_HOST` | Server host | 0.0.0.0 | No |
| `API_PORT` | Server port | 8080 | No |
| `LOG_LEVEL` | Logging level | info | No |

### Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

## 🛠 Development

### Available Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and run migration
- `npm run db:studio` - Open Prisma Studio

### Code Structure Guidelines

**Domain Layer:**
- Contains business logic and data operations
- Independent of HTTP concerns
- Uses repository pattern

**Controller Layer:**
- Handles HTTP requests and responses
- Input validation and serialization
- Route definitions

**Utils Layer:**
- Shared utilities and configurations
- Database client
- Error handling system

### Adding New Features

1. **Create domain logic:**
   ```typescript
   // domain/feature/repository.ts
   export const createFeature = async (data: CreateFeatureData) => {
     // Business logic here
   };
   ```

2. **Add validation schemas:**
   ```typescript
   // domain/feature/schema.ts
   export const CreateFeatureSchema = Type.Object({
     name: Type.String(),
     // ... other fields
   });
   ```

3. **Create routes:**
   ```typescript
   // controllers/rest-api/routes/feature.ts
   server.post('/feature', {
     schema: { body: CreateFeatureSchema }
   }, async (request, reply) => {
     // Route handler
   });
   ```

## 📊 Monitoring and Logging

The backend includes structured logging with:
- Request/response logging
- Error tracking with context
- Performance monitoring
- Request ID generation

Example log output:
```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "request": {
    "id": "req_1234567890_abc123",
    "method": "POST",
    "url": "/auth/login"
  },
  "response": {
    "statusCode": 200,
    "responseTime": "45ms"
  },
  "msg": "Request completed"
}
```

## 🔐 Security

### Implemented Security Measures

- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure token generation and validation
- **Input Validation:** Server-side validation for all inputs
- **CORS Configuration:** Properly configured cross-origin requests
- **SQL Injection Prevention:** Prisma ORM provides protection
- **Request Rate Limiting:** Can be easily added with fastify-rate-limit

### Security Best Practices

1. Always validate input on the server side
2. Use environment variables for secrets
3. Implement proper error handling without exposing sensitive data
4. Keep dependencies updated
5. Use HTTPS in production

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

Ensure these environment variables are set in production:
- `NODE_ENV=production`
- `DATABASE_URL` (production database)
- `JWT_SECRET` (strong secret key)
- `ALLOWED_ORIGINS` (your frontend domains)

### Health Checks

The API provides health check endpoints:
- `GET /` - Basic API status
- `GET /auth/health` - Auth service health

## 🧪 Testing

While not included in this boilerplate, recommended testing setup:

```bash
npm install --save-dev jest @types/jest supertest @types/supertest
```

Example test structure:
```typescript
describe('POST /auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);
      
    expect(response.body.token).toBeDefined();
  });
});
```

## 📈 Performance Considerations

- Prisma connection pooling
- JWT token caching
- Efficient database queries
- Request/response compression
- Proper indexing on database fields

## 🔄 API Versioning

For future API versions, consider:
- URL versioning (`/v1/auth/login`)
- Header versioning
- Separate route files per version
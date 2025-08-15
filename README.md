# Full-Stack Auth Boilerplate

A production-ready microservices boilerplate for building modern applications with authentication, featuring:

- **Backend**: Microservices architecture with Node.js + Fastify + TypeScript + Prisma + PostgreSQL
- **Frontend**: React Native + Expo + Zustand + TypeScript
- **Microservices**: REST API and Event Queue services with shared domain logic
- **Authentication**: JWT-based auth with secure error handling
- **State Management**: Zustand for performant React state
- **Database**: PostgreSQL with Prisma ORM
- **Error Handling**: Centralized error management with user-friendly messages
- **Docker**: Full containerization with microservices support for development and production
- **DevOps**: Automated scripts for microservices deployment and development workflow

## 📁 Project Structure

```
boilerplate/
├── .gitignore                   # Root project gitignore
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── package.json                 # Workspace configuration
├── scripts/                     # Development scripts
│   ├── setup.sh                # Initial project setup
│   ├── docker-dev.sh           # Development environment manager
│   └── docker-prod.sh          # Production deployment manager
├── backend/                     # Microservices Backend
│   ├── .gitignore              # Backend-specific ignores
│   ├── .dockerignore           # Docker build optimization
│   ├── Dockerfile              # Multi-stage production build (supports multiple services)
│   ├── controllers/            # Microservices (rest-api, event-queue)
│   │   ├── rest-api/          # REST API microservice
│   │   └── event-queue/       # Event Queue microservice
│   ├── domain/                 # Shared business logic (auth, user)
│   ├── utils/                  # Shared utilities (db, jwt, errors)
│   └── prisma/                 # Database schema and migrations
└── mobile/                      # React Native/Expo app
    ├── .gitignore              # Mobile-specific ignores
    ├── assets/                 # App icons and images
    ├── app/                    # Expo Router screens
    └── src/                    # Application source code
        ├── store/              # Zustand stores
        ├── hooks/              # Custom React hooks
        ├── services/           # API services
        ├── components/         # UI and feature components
        └── utils/              # Helper functions
```

## 🚀 Quick Start

### 🐳 Docker Quick Start (Recommended)

The easiest way to get started is using Docker:

```bash
# Clone the repository
git clone <your-repo-url>
cd boilerplate

# Run the setup script
./scripts/setup.sh

# Start the development environment
./scripts/docker-dev.sh start
```

**Access your services:**
- 🌐 REST API: http://localhost:8080
- 📋 Event Queue: Background service (no HTTP interface)
- 🗄️ Database: localhost:5432
- 📱 Mobile: `cd mobile && npm start`

**Useful commands:**
```bash
./scripts/docker-dev.sh logs        # View logs
./scripts/docker-dev.sh status      # Check service status  
./scripts/docker-dev.sh stop        # Stop services
```

### 📋 Manual Setup

If you prefer manual setup without Docker:

#### Prerequisites

- Node.js 18+
- PostgreSQL database
- Docker & Docker Compose (for containerized setup)
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database URL and JWT secret.

4. Set up database:
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

The REST API will be running at `http://localhost:8080`

## 🏗 Microservices Architecture

This boilerplate supports a microservices architecture with multiple services sharing domain logic:

### Available Services

#### REST API Service (`rest-api`)
- **Purpose**: HTTP API endpoints for client applications
- **Port**: 8080
- **Features**: Authentication, user management, RESTful endpoints
- **Health Check**: HTTP endpoint at `/`

#### Event Queue Service (`event-queue`)  
- **Purpose**: Background event processing and task queue
- **Port**: No HTTP interface (background service)
- **Features**: Asynchronous event processing, background jobs
- **Health Check**: Process monitoring

### Shared Components

Both services share:
- **Domain Logic** (`domain/`): Business logic for auth and user management
- **Utilities** (`utils/`): Database connections, JWT handling, error management
- **Database**: Same PostgreSQL instance and schema

### Service Management

Start specific services:
```bash
# Start all services
./scripts/docker-dev.sh start

# Start only REST API
./scripts/docker-dev.sh start --only-rest-api

# Start only Event Queue
./scripts/docker-dev.sh start --only-event-queue

# View service-specific logs
./scripts/docker-dev.sh logs rest-api
./scripts/docker-dev.sh logs event-queue
```

### Mobile Setup

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL in `src/services/api.ts` to match your backend URL

4. Start Expo development server:
   ```bash
   npm start
   ```

5. Use Expo Go app to scan QR code or run on simulator:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   ```

## ✨ Features

### Backend Features

- ✅ **Microservices Architecture** - Scalable service separation with shared domain logic
- ✅ **TypeScript** - Full type safety across all services
- ✅ **Fastify** - High-performance web framework for REST API
- ✅ **Prisma ORM** - Type-safe database access shared across services
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Centralized Error Handling** - Consistent error responses
- ✅ **Input Validation** - TypeBox schema validation
- ✅ **Request/Response Logging** - Structured logging with Pino
- ✅ **CORS Configuration** - Cross-origin resource sharing
- ✅ **Environment Configuration** - Type-safe config management
- ✅ **Database Migrations** - Version-controlled schema changes
- ✅ **Event Processing** - Background task processing with Event Queue service
- ✅ **Service Independence** - Deploy and scale services independently

### Mobile Features

- ✅ **React Native + Expo** - Cross-platform mobile development
- ✅ **Expo Router** - File-based navigation
- ✅ **Zustand State Management** - Lightweight, performant state
- ✅ **TypeScript** - Full type safety
- ✅ **Form Validation** - Client-side input validation
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Loading States** - Responsive UI feedback
- ✅ **Persistent Storage** - Zustand persistence
- ✅ **Custom Hooks** - Reusable logic patterns
- ✅ **Component Library** - Consistent UI components

## 🐳 Docker Development

### Overview

This boilerplate includes complete Docker containerization for both development and production environments:

- **Multi-stage Dockerfile** for optimized production builds
- **Development setup** with hot reload and debugging support
- **Production configuration** with security best practices
- **Automated scripts** for easy environment management
- **Database persistence** with Docker volumes
- **Health checks** and monitoring

### Development Environment

#### Starting Development Environment

```bash
# Quick start (with setup)
./scripts/setup.sh
./scripts/docker-dev.sh start

# Or manually
docker-compose up -d
```

#### Available Services

| Service | URL | Description |
|---------|-----|-------------|
| REST API | http://localhost:8080 | Fastify HTTP API server |
| Event Queue | Background Service | Event processing service (no HTTP interface) |
| Database | localhost:5432 | PostgreSQL database |
| Redis | localhost:6379 | Optional caching (--with-redis) |
| PgAdmin | http://localhost:8081 | Optional DB admin (--with-pgadmin) |

#### Development Commands

```bash
# Start services
./scripts/docker-dev.sh start                    # All microservices
./scripts/docker-dev.sh start --only-rest-api    # REST API only
./scripts/docker-dev.sh start --only-event-queue # Event Queue only
./scripts/docker-dev.sh start --with-redis       # Include Redis
./scripts/docker-dev.sh start --with-pgadmin     # Include PgAdmin

# Monitor services
./scripts/docker-dev.sh logs                     # All logs
./scripts/docker-dev.sh logs rest-api            # REST API logs only
./scripts/docker-dev.sh logs event-queue         # Event Queue logs only
./scripts/docker-dev.sh status                   # Service status
./scripts/docker-dev.sh health                   # Health check all services

# Development utilities
./scripts/docker-dev.sh shell                    # Microservice container shell
./scripts/docker-dev.sh db                       # Database shell
./scripts/docker-dev.sh restart --build          # Restart with rebuild

# Cleanup
./scripts/docker-dev.sh stop                     # Stop services
./scripts/docker-dev.sh clean                    # Remove everything
```

### Production Deployment

#### Production Setup

```bash
# Create production environment file
cp .env.example .env
# Edit .env with production values (JWT_SECRET, DB_PASSWORD, etc.)

# Deploy to production
./scripts/docker-prod.sh deploy
```

#### Production Services

```bash
# Deploy with additional services
./scripts/docker-prod.sh deploy --with-nginx     # Include Nginx reverse proxy
./scripts/docker-prod.sh deploy --with-redis     # Include Redis caching
./scripts/docker-prod.sh deploy --only-rest-api  # Deploy only REST API
./scripts/docker-prod.sh deploy --only-event-queue # Deploy only Event Queue

# Monitor production
./scripts/docker-prod.sh status                  # Service status
./scripts/docker-prod.sh logs                    # All logs
./scripts/docker-prod.sh logs rest-api           # REST API logs
./scripts/docker-prod.sh logs event-queue        # Event Queue logs

# Database operations
./scripts/docker-prod.sh backup                  # Create backup
./scripts/docker-prod.sh restore                 # Restore from backup

# Independent scaling
./scripts/docker-prod.sh scale rest-api=3 event-queue=1 # Scale services independently
```

### Docker Configuration

#### Development (`docker-compose.yml`)
- **Hot reload** for backend development
- **Volume mounts** for live code updates
- **Debug logging** enabled
- **Development database** with easy access

#### Production (`docker-compose.prod.yml`)
- **Optimized builds** with multi-stage Dockerfile
- **Security hardening** (read-only filesystem, non-root user)
- **Resource limits** and health checks
- **Automatic restarts** and logging configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your-strong-password
DB_NAME=auth_boilerplate

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key

# Redis Configuration (optional)
REDIS_PASSWORD=your-redis-password

# Logging
LOG_LEVEL=info
```

### Docker Best Practices

This boilerplate implements Docker best practices:

- **Multi-stage builds** for smaller production images
- **Non-root user** for security
- **Health checks** for service monitoring
- **Layer caching** optimization
- **Security scanning** ready configuration
- **Resource limits** in production
- **Proper logging** configuration

### Troubleshooting

#### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Ensure database is healthy before backend starts
3. **File permissions**: Scripts should be executable (`chmod +x scripts/*.sh`)
4. **Memory issues**: Increase Docker memory limits

#### Debug Commands

```bash
# Check container status
docker ps

# View container logs
docker logs auth_boilerplate_backend

# Access container
docker exec -it auth_boilerplate_backend sh

# Check Docker resources
docker system df
docker system prune  # Cleanup unused resources
```

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Mobile Documentation](./mobile/README.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🛠 Development

### Available Scripts

**Root Level:**
- `npm run setup` - Initial project setup
- `npm run dev` - Start Docker development environment
- `npm run dev:logs` - View development logs
- `npm run dev:stop` - Stop development environment
- `npm run prod:deploy` - Deploy to production

**Backend:**
- `npm run dev` - Start development server (defaults to REST API)
- `npm run dev:rest-api` - Start REST API development server
- `npm run dev:event-queue` - Start Event Queue development server
- `npm run build` - Build all services for production
- `npm run start` - Start production server (defaults to REST API)
- `npm run start:rest-api` - Start REST API production server
- `npm run start:event-queue` - Start Event Queue production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations

**Mobile:**
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

**Docker Commands:**
- `./scripts/docker-dev.sh start` - Start development environment
- `./scripts/docker-prod.sh deploy` - Deploy to production
- `docker-compose up -d` - Start services manually
- `docker-compose logs -f` - View all logs

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type checking
- Prettier for code formatting (recommended)

## 🧪 Testing

Testing setup is not included in this boilerplate but can be easily added:

**Backend Testing:**
- Jest + Supertest for API testing
- Prisma test database setup

**Mobile Testing:**
- Jest + React Native Testing Library
- Detox for E2E testing

## 📦 Deployment

### Backend Deployment

The backend can be deployed to any Node.js hosting platform:
- Railway
- Vercel
- Heroku
- DigitalOcean App Platform
- AWS/GCP/Azure

### Mobile Deployment

- Use EAS Build for app store deployment
- Expo Updates for over-the-air updates
- See [Expo deployment docs](https://docs.expo.dev/build/introduction/) for details

## 🔒 Security Considerations

- JWT tokens are stored securely using AsyncStorage
- Password hashing using bcrypt with salt rounds
- Input validation on both client and server
- CORS properly configured
- Environment variables for sensitive data
- SQL injection prevention with Prisma

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Fastify](https://www.fastify.io/)
- Database powered by [Prisma](https://www.prisma.io/)
- Mobile development with [Expo](https://expo.dev/)
- State management by [Zustand](https://github.com/pmndrs/zustand)
- Type safety with [TypeScript](https://www.typescriptlang.org/)
# GuildQuest Backend

Production-ready gamified task management system with virtual pet mechanics built with Go, Gin, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Business Logic](#business-logic)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

## ✨ Features

- **User Authentication**: JWT-based auth with access & refresh tokens
- **Task Management**: Create, complete, and delete quests with gold rewards
- **Virtual Pet System**: Dragon pet with level progression, hunger, and happiness mechanics
- **Decoration Shop**: Purchase cosmetic room decorations with earned gold
- **PWA Support**: Offline sync capabilities for progressive web apps
- **QR Code Invites**: Generate QR codes for user onboarding
- **REST API**: Clean, documented RESTful endpoints
- **Swagger Documentation**: Interactive API documentation

## 🏗️ Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              HTTP Layer (Gin)                   │
│              Handlers (HTTP)                    │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           Business Logic Layer                  │
│              Services (Domain)                  │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           Data Access Layer                     │
│           Repositories (Persistence)            │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│              Database (PostgreSQL)              │
│              Models (Domain Entities)           │
└─────────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Handlers** (`internal/handlers/`): HTTP request/response handling, input validation, no business logic
2. **Services** (`internal/services/`): All business logic, transaction management, orchestration
3. **Repositories** (`internal/repositories/`): Database operations, query abstraction
4. **Models** (`internal/models/`): Domain entities, DTOs, database models

### Key Architectural Decisions

- **Dependency Injection**: All dependencies injected through constructors
- **Interface-Driven**: Repositories and services use interfaces for testability
- **Single Responsibility**: Each layer has one clear responsibility
- **Middleware Pipeline**: Auth, logging, recovery, CORS as reusable middleware
- **Error Handling**: Consistent error responses across all endpoints

## 🛠️ Tech Stack

- **Language**: Go 1.21+
- **Web Framework**: Gin (HTTP routing)
- **Database**: PostgreSQL 15+
- **ORM**: GORM
- **Authentication**: JWT (golang-jwt/jwt)
- **Documentation**: Swagger/OpenAPI (swaggo)
- **QR Codes**: go-qrcode
- **Environment**: godotenv
- **Container**: Docker & Docker Compose

## 📁 Project Structure

```
guildquest/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go            # Configuration management
│   ├── database/
│   │   └── database.go          # Database connection & migrations
│   ├── models/
│   │   └── models.go            # Domain models & DTOs
│   ├── repositories/
│   │   ├── user_repository.go   # User data access
│   │   ├── task_repository.go   # Task data access
│   │   ├── pet_repository.go    # Pet data access
│   │   └── decoration_repository.go
│   ├── services/
│   │   ├── auth_service.go      # Authentication logic
│   │   ├── task_service.go      # Task business logic
│   │   ├── pet_service.go       # Pet mechanics
│   │   ├── decoration_service.go
│   │   ├── sync_service.go      # PWA sync logic
│   │   └── invite_service.go    # Invite & QR generation
│   ├── handlers/
│   │   ├── auth_handler.go      # Auth endpoints
│   │   ├── task_handler.go      # Task endpoints
│   │   ├── pet_handler.go       # Pet endpoints
│   │   ├── decoration_handler.go
│   │   ├── sync_handler.go
│   │   └── invite_handler.go
│   ├── middleware/
│   │   ├── auth.go              # JWT authentication
│   │   ├── logger.go            # Request logging
│   │   ├── recovery.go          # Panic recovery
│   │   └── cors.go              # CORS handling
│   └── routes/
│       └── routes.go            # Route configuration
├── docs/                        # Generated Swagger docs
├── .env.example                 # Environment template
├── go.mod                       # Go dependencies
├── go.sum                       # Dependency checksums
├── Makefile                     # Build commands
├── Dockerfile                   # Container image
├── docker-compose.yml           # Multi-container setup
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 15 or higher
- Docker & Docker Compose (optional)
- Make (optional, for convenience)

### Option 1: Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd guildquest
```

2. **Install dependencies**
```bash
make install
# or manually:
go mod download
go install github.com/swaggo/swag/cmd/swag@latest
```

3. **Setup PostgreSQL**

Using Docker:
```bash
make docker-up
```

Or manually install PostgreSQL and create database:
```sql
CREATE DATABASE guildquest;
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

5. **Generate Swagger documentation**
```bash
make swagger
```

6. **Run the application**
```bash
make run
# or
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

### Option 2: Docker Compose

1. **Create environment file**
```bash
cp .env.example .env
# Update JWT_SECRET in .env
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **View logs**
```bash
docker-compose logs -f backend
```

### Quick Start Commands

```bash
# Install dependencies
make install

# Start PostgreSQL
make docker-up

# Generate Swagger docs
make swagger

# Run application
make run

# Run tests
make test

# Development mode (hot reload)
make dev

# Stop PostgreSQL
make docker-down

# Clean build artifacts
make clean
```

## 📚 API Documentation

Once the server is running, access Swagger UI at:

```
http://localhost:8080/swagger/index.html
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/me` - Get current user profile

#### Tasks
- `GET /api/v1/tasks` - List all tasks
- `POST /api/v1/tasks` - Create task
- `POST /api/v1/tasks/bulk` - Create multiple tasks
- `POST /api/v1/tasks/{id}/complete` - Complete task
- `DELETE /api/v1/tasks/{id}` - Delete task

#### Pet
- `GET /api/v1/pet` - Get pet status
- `POST /api/v1/pet/feed` - Feed pet (20 gold)
- `POST /api/v1/pet/play` - Play with pet (free)

#### Decorations
- `GET /api/v1/decorations` - List owned decorations
- `POST /api/v1/decorations/buy` - Buy decoration (50 gold)

#### Sync (PWA)
- `POST /api/v1/sync` - Sync all data since last sync

#### Invites
- `POST /api/v1/invite` - Create invite with QR code
- `GET /api/v1/invite/{token}` - Validate invite
- `GET /api/v1/invite/{token}/qr` - Get QR code image

### Authentication

All protected endpoints require JWT Bearer token:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:8080/api/v1/tasks
```

## 🎮 Business Logic

### Task Completion Flow

When a task is completed:

1. **Task marked as complete** (idempotent)
2. **Gold awarded** to user (task.reward amount)
3. **Pet receives rewards**:
   - +10 EXP
   - +5 happiness
4. **Level up check**:
   - If `pet.exp >= pet.level * 100`
   - Level increases by 1
   - EXP resets to 0

### Pet Actions

#### Feed Pet
- **Cost**: 20 gold
- **Effects**: 
  - Hunger +30 (clamped 0-100)
  - Happiness +10 (clamped 0-100)
- **Validation**: Sufficient gold required

#### Play With Pet
- **Cost**: Free
- **Effects**:
  - Happiness +20 (clamped 0-100)
  - Hunger -5 (clamped 0-100)

### Decoration Purchase
- **Cost**: 50 gold per decoration
- **Validation**: 
  - Cannot repurchase owned decorations
  - Sufficient gold required
- **Effect**: Gold deducted, decoration added

### PWA Sync Logic

The `/sync` endpoint implements last-write-wins conflict resolution:

1. Client sends `lastSyncAt` timestamp
2. Server returns all records updated since that time
3. Client merges changes locally
4. **Conflict Resolution**: Server timestamp always wins

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    gold INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    reward INT DEFAULT 10,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

### Pets Table
```sql
CREATE TABLE pets (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    type TEXT DEFAULT 'dragon',
    level INT DEFAULT 1,
    exp INT DEFAULT 0,
    hunger INT DEFAULT 100,
    happiness INT DEFAULT 100,
    updated_at TIMESTAMP
);
```

### Decorations Table
```sql
CREATE TABLE decorations (
    user_id UUID REFERENCES users(id),
    decoration TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, decoration)
);
```

## 🚢 Deployment

### Environment Variables (Production)

```bash
ENVIRONMENT=production
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=<generate-strong-random-key-min-32-chars>
APP_URL=https://yourdomain.com
PORT=8080
```

### Build for Production

```bash
make build-prod
```

This creates a statically-linked binary in `bin/guildquest`

### Docker Deployment

```bash
# Build image
docker build -t guildquest:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL="postgres://..." \
  -e JWT_SECRET="your-secret" \
  --name guildquest \
  guildquest:latest
```

### Kubernetes Deployment

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guildquest
spec:
  replicas: 3
  selector:
    matchLabels:
      app: guildquest
  template:
    metadata:
      labels:
        app: guildquest
    spec:
      containers:
      - name: guildquest
        image: guildquest:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: guildquest-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: guildquest-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Database Migration

Migrations run automatically on server startup. To run manually:

```go
go run cmd/server/main.go migrate
```

## 🧪 Testing

Run tests:
```bash
make test
```

Run with coverage:
```bash
go test -v -cover -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 🔒 Security Considerations

1. **JWT Secret**: Use strong random secret (minimum 32 characters)
2. **Password Hashing**: bcrypt with default cost factor (10)
3. **SQL Injection**: GORM with parameterized queries prevents injection
4. **CORS**: Configure allowed origins in production
5. **HTTPS**: Always use TLS in production
6. **Rate Limiting**: Consider adding rate limiting middleware
7. **Input Validation**: All inputs validated via Gin binding

## 📈 Performance Optimization

- **Database Connection Pooling**: Configured via GORM
- **Indexes**: Added on frequently queried columns (user_id)
- **Caching**: Consider adding Redis for session management
- **Load Balancing**: Stateless design allows horizontal scaling

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U postgres -d guildquest
```

### Swagger Generation Fails
```bash
# Reinstall swag
go install github.com/swaggo/swag/cmd/swag@latest

# Clean and regenerate
rm -rf docs/
make swagger
```

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@guildquest.io

---

Built with ❤️ using Go and Clean Architecture principles

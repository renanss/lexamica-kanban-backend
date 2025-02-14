# Lexamica Kanban Backend

A RESTful API service for managing a Kanban board, built with Node.js, Express, and MongoDB.

## Tech Stack

- Node.js & Express
- TypeScript
- MongoDB with Mongoose ODM
- Jest for testing
- Swagger for API documentation

## Features

- RESTful API endpoints for columns and tasks
- Pagination and sorting
- Request validation using Joi
- Error handling middleware
- Request logging with Morgan
- Rate limiting
- Security headers with Helmet
- CORS support
- API documentation with Swagger

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions
├── validations/    # Request validation schemas
└── types/          # TypeScript type definitions
```

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (or use Docker from main repository)

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Available Scripts

```bash
# Development with hot-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm test

# Run integration tests
npm run test:integration

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## API Documentation

When running the server, access the Swagger documentation at:
```
http://localhost:4000/api-docs
```

## Important Notes

### MongoDB Transactions
In development, we use a standalone MongoDB instance for simplicity. MongoDB transactions require a replica set configuration, which we've opted not to implement in development for these reasons:
- Reduced complexity in development setup
- Lower resource requirements
- Faster startup time

For production deployments, consider implementing a MongoDB replica set to enable transaction support.

## Environment Variables

The following environment variables can be configured in `.env`:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017/kanban

# Server
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

## API Rate Limiting

- Development: 1000 requests per 15 minutes
- Production: 100 requests per 15 minutes

## Error Handling

The API uses a centralized error handling mechanism:
- Custom ApiError class for operational errors
- Global error handling middleware
- Validation error handling
- 404 handling for undefined routes

## Testing

- Unit tests with Jest
- Integration tests with supertest
- In-memory MongoDB for testing
- Coverage thresholds configured in jest.config.js

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE) 
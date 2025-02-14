import processEnv from './env';

const config = {
  env: processEnv.NODE_ENV,
  port: processEnv.PORT,
  mongoose: {
    url: processEnv.MONGODB_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  pagination: {
    defaultLimit: 10,
    defaultPage: 1,
    maxLimit: 100,
  },
  cors: {
    origin: processEnv.CORS_ORIGIN,
    credentials: true,
  },
  swagger: {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Kanban Board API',
        version: '1.0.0',
        description: 'A RESTful API for managing a Kanban board'
      },
      servers: [
        {
          url: `http://localhost:${processEnv.PORT.toString()}`,
          description: 'Development server'
        }
      ]
    },
    apis: ['./src/routes/*.ts']
  },
};

export default config; 
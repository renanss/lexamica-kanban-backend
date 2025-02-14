import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import config from './config/config';
import logger from './utils/logger';
import { errorConverter, errorHandler } from './middleware/error';
import ApiError from './utils/ApiError';
import requestLogger from './middleware/requestLogger';
import rateLimiter from './middleware/rateLimiter';

import connectDB from './config/database';

import columnsRouter from './routes/columns';
import tasksRouter from './routes/tasks';

const app = express();

connectDB();

app.use(helmet());
app.use(cors(config.cors));
app.use(rateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/columns', columnsRouter);
app.use('/api/tasks', tasksRouter);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Not found'));
});

app.use(errorConverter);
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 
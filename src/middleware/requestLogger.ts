import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import config from '../config/config';

interface RequestWithBody extends Request {
  body: any;
}

// Add custom tokens
morgan.token('body', (req: RequestWithBody) => JSON.stringify(req.body));
morgan.token('params', (req: Request) => JSON.stringify(req.params));
morgan.token('query', (req: Request) => JSON.stringify(req.query));

// Create a custom format that includes request details
const customFormat = (tokens: morgan.TokenIndexer<Request, Response>, req: Request, res: Response): string => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    body: tokens.body(req, res),
    params: tokens.params(req, res),
    query: tokens.query(req, res),
    userAgent: tokens['user-agent'](req, res),
    timestamp: tokens.date(req, res, 'iso'),
    ip: tokens['remote-addr'](req, res)
  });
};

// Create different logging configurations for development and production
const developmentFormat = (tokens: morgan.TokenIndexer<Request, Response>, req: Request, res: Response): string => {
  const coloredMethod = colorMethod(tokens.method(req, res));
  const coloredStatus = colorStatus(tokens.status(req, res));
  return [
    coloredMethod,
    tokens.url(req, res),
    coloredStatus,
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
};

// Helper functions for coloring console output in development
const colorMethod = (method: string | undefined): string => {
  const colors = {
    GET: '\x1b[32m', // green
    POST: '\x1b[34m', // blue
    PUT: '\x1b[33m', // yellow
    DELETE: '\x1b[31m', // red
    PATCH: '\x1b[36m', // cyan
    reset: '\x1b[0m'
  } as const;
  return `${colors[method as keyof typeof colors] || ''}${method}${colors.reset}`;
};

const colorStatus = (status: string | undefined): string => {
  if (!status) return '';
  const code = parseInt(status);
  if (code >= 500) return `\x1b[31m${status}\x1b[0m`; // red
  if (code >= 400) return `\x1b[33m${status}\x1b[0m`; // yellow
  if (code >= 300) return `\x1b[36m${status}\x1b[0m`; // cyan
  if (code >= 200) return `\x1b[32m${status}\x1b[0m`; // green
  return status;
};

// Create the middleware based on environment
const requestLogger = morgan(
  config.env === 'development' ? developmentFormat : customFormat,
  {
    stream: {
      write: (message: string) => {
        if (config.env === 'development') {
          console.log(message.trim());
        } else {
          logger.info(message.trim());
        }
      }
    },
    skip: (req: Request) => {
      // Skip logging for health check endpoints
      return req.url === '/health';
    }
  }
);

export default requestLogger; 
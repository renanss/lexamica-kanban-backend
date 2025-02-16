import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { ITask, IColumn } from '../types';
import logger from '../utils/logger';

interface ServerToClientEvents {
  'task:updated': (task: ITask) => void;
  'task:created': (task: ITask) => void;
  'task:deleted': (taskId: string, columnId: string) => void;
  'task:moved': (task: ITask) => void;
  'column:updated': (column: IColumn) => void;
}

export class WebSocketServer {
  private io: Server<Record<string, never>, ServerToClientEvents>;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Method to broadcast events to all connected clients
  public broadcast<T extends keyof ServerToClientEvents>(
    event: T,
    ...args: Parameters<ServerToClientEvents[T]>
  ) {
    this.io.emit(event, ...args);
  }
}

export default WebSocketServer; 
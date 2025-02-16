import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ITask, IColumn } from '../types';
import logger from '../utils/logger';

interface ServerToClientEvents {
  'task:updated': (task: ITask) => void;
  'task:created': (task: ITask) => void;
  'task:deleted': (taskId: string, columnId: string) => void;
  'task:moved': (task: ITask) => void;
  'column:updated': (column: IColumn) => void;
}

interface ClientToServerEvents {
  'task:update': (task: ITask) => void;
  'task:create': (task: Partial<ITask>) => void;
  'task:delete': (taskId: string, columnId: string) => void;
  'task:move': (taskId: string, targetColumnId: string, order: number) => void;
  'column:update': (column: IColumn) => void;
}

export class WebSocketServer {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

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
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle task events
      socket.on('task:update', (task) => {
        logger.info(`Task updated: ${task._id}`);
        this.io.emit('task:updated', task);
      });

      socket.on('task:create', (task) => {
        logger.info('New task created');
        this.io.emit('task:created', task as ITask);
      });

      socket.on('task:delete', (taskId, columnId) => {
        logger.info(`Task deleted: ${taskId}`);
        this.io.emit('task:deleted', taskId, columnId);
      });

      socket.on('task:move', (taskId, targetColumnId, order) => {
        logger.info(`Task moved: ${taskId} to column ${targetColumnId}`);
        // Note: You might want to fetch the updated task from the database
        // and emit that instead of constructing a partial task object
        this.io.emit('task:moved', {
          _id: taskId,
          columnId: targetColumnId,
          order,
        } as ITask);
      });

      // Handle column events
      socket.on('column:update', (column) => {
        logger.info(`Column updated: ${column._id}`);
        this.io.emit('column:updated', column);
      });

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
import { Request, Response, NextFunction } from 'express';
import taskService from '../services/taskService';
import { ITaskCreate, ITaskMove, IRequestParams, IRequestQuery } from '../types';
import ApiError from '../utils/ApiError';

export const getAllTasks = async (
  req: Request<Record<string, never>, unknown, unknown, IRequestQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const result = await taskService.getAllTasks(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTasksByColumn = async (
  req: Request<IRequestParams, unknown, unknown, IRequestQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { columnId } = req.params;
    const { page, limit } = req.query;

    if (!columnId) {
      throw new ApiError(400, 'Column ID is required');
    }

    const result = await taskService.getTasksByColumn(
      columnId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request<Record<string, never>, unknown, ITaskCreate>,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof Error && error.message === 'Column not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const updateTask = async (
  req: Request<IRequestParams, unknown, Partial<ITaskCreate>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      throw new ApiError(400, 'Task ID is required');
    }
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Task not found' || error.message === 'Column not found') {
        res.status(404).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
};

export const deleteTask = async (
  req: Request<IRequestParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      throw new ApiError(400, 'Task ID is required');
    }
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const moveTask = async (
  req: Request<IRequestParams, unknown, ITaskMove>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      throw new ApiError(400, 'Task ID is required');
    }
    const task = await taskService.moveTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
        return;
      }
    }
    next(error);
  }
}; 
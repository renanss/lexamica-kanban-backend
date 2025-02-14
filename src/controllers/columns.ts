import { Request, Response, NextFunction } from 'express';
import columnService from '../services/columnService';
import { IColumnCreate, IRequestParams, IRequestQuery } from '../types';
import ApiError from '../utils/ApiError';

export const getAllColumns = async (
  req: Request<Record<string, never>, unknown, unknown, IRequestQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit } = req.query;
    const result = await columnService.getAllColumns(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createColumn = async (
  req: Request<Record<string, never>, unknown, IColumnCreate>,
  res: Response,
  next: NextFunction
) => {
  try {
    const column = await columnService.createColumn(req.body);
    res.status(201).json(column);
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (
  req: Request<IRequestParams, unknown, Partial<IColumnCreate>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      throw new ApiError(400, 'Column ID is required');
    }
    const column = await columnService.updateColumn(req.params.id, req.body);
    res.json(column);
  } catch (error) {
    if (error instanceof Error && error.message === 'Column not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export const deleteColumn = async (
  req: Request<IRequestParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.params.id) {
      throw new ApiError(400, 'Column ID is required');
    }
    await columnService.deleteColumn(req.params.id);
    res.status(204).end();
  } catch (error) {
    if (error instanceof Error && error.message === 'Column not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    next(error);
  }
}; 
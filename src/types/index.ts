import { Document, Types } from 'mongoose';

export interface IColumn extends Document {
  _id: Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  columnId: Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginationQuery {
  page?: string;
  limit?: string;
}

export interface IColumnCreate {
  title: string;
  order?: number;
}

export interface ITaskCreate {
  title: string;
  description?: string;
  columnId: string;
  order?: number;
}

export interface ITaskMove {
  targetColumnId: string;
  order: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface IError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Request types
export interface IRequestParams {
  id?: string;
  columnId?: string;
}

export interface IRequestQuery extends IPaginationQuery {
  [key: string]: string | undefined;
}

export interface IRequestBody {
  [key: string]: unknown;
}

// Express request extensions
declare global {
  namespace Express {
    interface Request {
      validatedData?: unknown;
    }
  }
} 
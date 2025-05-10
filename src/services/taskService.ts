import { Types } from 'mongoose';
import Task from '../models/Task';
import Column from '../models/Column';
import { ITask, ITaskCreate, ITaskMove, IPaginatedResponse } from '../types';
import ApiError from '../utils/ApiError';

class TaskService {
  async getAllTasks(page: number = 1, limit: number = 10): Promise<IPaginatedResponse<ITask>> {
    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const [result] = await Task.aggregate([
      {
        $facet: {
          metadata: [
            { $count: 'total' }
          ],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(String(limit), 10) },
            {
              $lookup: {
                from: 'columns',
                localField: 'columnId',
                foreignField: '_id',
                as: 'column'
              }
            },
            { $unwind: '$column' },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                order: 1,
                createdAt: 1,
                updatedAt: 1,
                columnId: 1,
                'column.title': 1
              }
            }
          ]
        }
      }
    ]);

    const total = result.metadata[0]?.total || 0;

    return {
      data: result.data,
      pagination: {
        currentPage: parseInt(String(page), 10),
        totalPages: Math.ceil(total / parseInt(String(limit), 10)),
        totalItems: total,
        itemsPerPage: parseInt(String(limit), 10)
      }
    };
  }

  async getTasksByColumn(columnId: string, page: number = 1, limit: number = 10): Promise<IPaginatedResponse<ITask>> {
    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);

    const [result] = await Task.aggregate([
      {
        $facet: {
          metadata: [
            { $match: { columnId: new Types.ObjectId(columnId) } },
            { $count: 'total' }
          ],
          data: [
            { $match: { columnId: new Types.ObjectId(columnId) } },
            { $sort: { order: 1 } },
            { $skip: skip },
            { $limit: parseInt(String(limit), 10) },
            {
              $lookup: {
                from: 'columns',
                localField: 'columnId',
                foreignField: '_id',
                as: 'column'
              }
            },
            { $unwind: '$column' },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                order: 1,
                createdAt: 1,
                updatedAt: 1,
                columnId: 1,
                'column.title': 1
              }
            }
          ]
        }
      }
    ]);

    const total = result.metadata[0]?.total || 0;

    return {
      data: result.data,
      pagination: {
        currentPage: parseInt(String(page), 10),
        totalPages: Math.ceil(total / parseInt(String(limit), 10)),
        totalItems: total,
        itemsPerPage: parseInt(String(limit), 10)
      }
    };
  }

  async createTask(taskData: ITaskCreate): Promise<ITask> {
    // Check if column exists
    const column = await Column.findById(taskData.columnId);
    if (!column) {
      throw new ApiError(404, 'Column not found');
    }

    // Get last task order in the column
    const lastTask = await Task.findOne({ columnId: taskData.columnId })
      .sort({ order: -1 })
      .limit(1);

    const order = lastTask ? lastTask.order + 1 : 0;

    const task = new Task({
      ...taskData,
      columnId: new Types.ObjectId(taskData.columnId),
      order
    });

    await task.save();

    // Return task with column information
    const taskWithColumn = await Task.findById(task._id).populate('columnId', 'title');
    if (!taskWithColumn) {
      throw new ApiError(500, 'Failed to create task');
    }

    return taskWithColumn;
  }

  async updateTask(id: string, taskData: Partial<ITaskCreate>): Promise<ITask> {
    if (taskData.columnId) {
      const column = await Column.findById(taskData.columnId);
      if (!column) {
        throw new ApiError(404, 'Column not found');
      }
    }

    const task = await Task.findByIdAndUpdate(
      id,
      { $set: taskData },
      { new: true, runValidators: true }
    ).populate('columnId', 'title');

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    await Task.deleteOne({ _id: id });

    // Update order of remaining tasks in the column
    await Task.updateMany(
      { 
        columnId: task.columnId,
        order: { $gt: task.order }
      },
      { $inc: { order: -1 } }
    );
  }

  async moveTask(taskId: string, { targetColumnId, order }: ITaskMove): Promise<ITask> {
    // Get task and validate columns
    const [task, targetColumn] = await Promise.all([
      Task.findById(taskId),
      Column.findById(targetColumnId)
    ]);

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    if (!targetColumn) {
      throw new ApiError(404, 'Target column not found');
    }

    // Update orders in source column
    await Task.updateMany(
      { 
        columnId: task.columnId,
        order: { $gt: task.order }
      },
      { $inc: { order: -1 } }
    );

    // Update orders in target column
    await Task.updateMany(
      {
        columnId: new Types.ObjectId(targetColumnId),
        order: { $gte: order }
      },
      { $inc: { order: 1 } }
    );

    // Update the task itself
    task.columnId = new Types.ObjectId(targetColumnId);
    task.order = order;
    await task.save();

    // Return updated task with column information
    const updatedTask = await Task.findById(taskId).populate('columnId', 'title');
    if (!updatedTask) {
      throw new ApiError(500, 'Failed to update task');
    }

    return updatedTask;
  }
}

export default new TaskService(); 
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

  async deleteTask(id: string): Promise<ITask> {
    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    // Store task info before deletion
    const taskInfo = task.toObject();

    await Task.findOneAndDelete({ _id: id });

    // Update order of remaining tasks in the column
    await Task.updateMany(
      { 
        columnId: task.columnId,
        order: { $gt: task.order }
      },
      { $inc: { order: -1 } }
    );

    return taskInfo;
  }

  async moveTask(taskId: string, { targetColumnId, order }: ITaskMove): Promise<ITask> {
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

    const isMovingColumn = task.columnId.toString() !== targetColumnId;

    // Get all tasks in target column
    const targetColumnTasks = await Task.find({ 
      columnId: new Types.ObjectId(targetColumnId),
      _id: { $ne: taskId } // Exclude the task being moved
    }).sort({ order: 1 });

    // Calculate new order
    let newOrder: number;
    if (targetColumnTasks.length === 0) {
      // If no other tasks in target column, use a large initial order
      newOrder = 65536; // 2^16
    } else {
      // Get the orders of all tasks
      const orders = targetColumnTasks.map(t => t.order);
      
      if (order <= orders[0]) {
        // Moving to start: use half of first task's order
        newOrder = Math.max(1, Math.floor(orders[0] / 2));
      } else if (order >= orders[orders.length - 1]) {
        // Moving to end: add a large increment to last task's order
        newOrder = orders[orders.length - 1] + 65536;
      } else {
        // Find insertion point
        let prevOrder = 0;
        let nextOrder = 65536;
        for (let i = 0; i < orders.length - 1; i++) {
          if (order >= orders[i] && order <= orders[i + 1]) {
            prevOrder = orders[i];
            nextOrder = orders[i + 1];
            break;
          }
        }
        // Place halfway between the two orders
        newOrder = prevOrder + Math.floor((nextOrder - prevOrder) / 2);
      }
    }

    // Try to update the task with optimistic locking
    const maxRetries = 3;
    let retryCount = 0;
    let updatedTask = null;

    while (retryCount < maxRetries) {
      try {
        // Attempt to update the task atomically
        updatedTask = await Task.findOneAndUpdate(
          { 
            _id: taskId,
            $or: [
              { order: { $ne: newOrder } }, // Only update if order is different
              { columnId: { $ne: new Types.ObjectId(targetColumnId) } } // Or if column is different
            ]
          },
          { 
            $set: { 
              columnId: new Types.ObjectId(targetColumnId),
              order: newOrder
            }
          },
          { 
            new: true,
            runValidators: true
          }
        );

        if (updatedTask) break; // Success

        // If no update occurred, try a different order
        newOrder += Math.floor(Math.random() * 1000) + 1;
        retryCount++;
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 11000 && retryCount < maxRetries - 1) {
          // On duplicate key error, try a different order
          newOrder += 65536;
          retryCount++;
          continue;
        }
        throw error;
      }
    }

    if (!updatedTask) {
      throw new ApiError(500, 'Failed to update task after multiple retries');
    }

    // If we moved to a different column, update the source column tasks
    if (isMovingColumn) {
      await Task.updateMany(
        { 
          columnId: task.columnId,
          order: { $gt: task.order }
        },
        { $inc: { order: -1 } }
      );
    }

    // Check if rebalancing is needed
    const needsRebalancing = await this.checkIfRebalancingNeeded(targetColumnId);
    if (needsRebalancing) {
      await this.rebalanceColumn(targetColumnId);
    }

    // Return task with column information
    const taskWithColumn = await Task.findById(taskId).populate('columnId', 'title');
    if (!taskWithColumn) {
      throw new ApiError(500, 'Failed to retrieve updated task');
    }

    return taskWithColumn;
  }

  private async checkIfRebalancingNeeded(columnId: string): Promise<boolean> {
    const tasks = await Task.find({ 
      columnId: new Types.ObjectId(columnId) 
    }).sort({ order: 1 });

    if (tasks.length < 2) return false;

    const minGap = 1000;
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i].order - tasks[i - 1].order < minGap) {
        return true;
      }
    }

    return false;
  }

  private async rebalanceColumn(columnId: string): Promise<void> {
    const tasks = await Task.find({ 
      columnId: new Types.ObjectId(columnId) 
    }).sort({ order: 1 });

    const orderUpdates = tasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { order: (index + 1) * 65536 } }
      }
    }));

    if (orderUpdates.length > 0) {
      await Task.bulkWrite(orderUpdates);
    }
  }
}

export default new TaskService(); 
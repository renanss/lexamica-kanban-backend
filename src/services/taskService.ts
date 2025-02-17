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
    console.log('Starting moveTask:', { taskId, targetColumnId, order });
    
    const [task, targetColumn] = await Promise.all([
      Task.findById(taskId),
      Column.findById(targetColumnId)
    ]);

    console.log('Found task and column:', { 
      task: task?.toObject(), 
      targetColumn: targetColumn?.toObject() 
    });

    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    if (!targetColumn) {
      throw new ApiError(404, 'Target column not found');
    }

    try {
      console.log('Finding affected tasks with criteria:', {
        columnId: targetColumnId,
        orderGreaterOrEqual: order,
        excludedTaskId: taskId
      });

      // Get affected tasks sorted by order (descending)
      const affectedTasks = await Task.find({
        columnId: new Types.ObjectId(targetColumnId),
        order: { $gte: order },
        _id: { $ne: taskId }
      }).sort({ order: -1 });

      console.log('Found affected tasks:', affectedTasks.map(t => ({
        id: t._id.toString(),
        order: t.order
      })));

      // Update tasks sequentially, waiting for each update to complete
      console.log('Starting sequential updates of affected tasks...');
      
      await affectedTasks.reduce<Promise<void>>(async (promise, affectedTask) => {
        await promise;
        // Skip the order if it's the same as the task being moved
        const newOrder = affectedTask.order + (task.order === affectedTask.order + 1 ? 2 : 1);
        
        console.log('Updating task order:', {
          taskId: affectedTask._id.toString(),
          oldOrder: affectedTask.order,
          newOrder,
          skipped: task.order === affectedTask.order + 1
        });
        
        await Task.findByIdAndUpdate(affectedTask._id, {
          $set: { order: newOrder }
        });
      }, Promise.resolve());

      console.log('All affected tasks updated. Moving target task:', {
        taskId,
        newColumnId: targetColumnId,
        newOrder: order
      });

      // Only after all tasks are updated, update the moved task
      await Task.findByIdAndUpdate(taskId, {
        columnId: new Types.ObjectId(targetColumnId),
        order: order
      });

      console.log('Target task moved. Fetching final state...');

      // Get updated task with column information
      const updatedTask = await Task.findById(taskId).populate('columnId', 'title');
      if (!updatedTask) {
        throw new ApiError(500, 'Failed to retrieve updated task');
      }

      console.log('Final task state:', updatedTask.toObject());
      return updatedTask;
    } catch (error) {
      console.error('Failed to move task:', error);
      throw new ApiError(500, 'Failed to move task');
    }
  }

}

export default new TaskService(); 
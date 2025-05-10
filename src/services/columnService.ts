import { Types } from 'mongoose';
import Column from '../models/Column';
import Task from '../models/Task';
import { IColumn, IColumnCreate, IPaginatedResponse } from '../types';
import ApiError from '../utils/ApiError';

class ColumnService {
  async getAllColumns(page: number = 1, limit: number = 10): Promise<IPaginatedResponse<IColumn>> {
    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    
    const [result] = await Column.aggregate([
      {
        $facet: {
          metadata: [
            { $count: 'total' }
          ],
          data: [
            { $sort: { order: 1 } },
            { $skip: skip },
            { $limit: parseInt(String(limit), 10) },
            {
              $lookup: {
                from: 'tasks',
                localField: '_id',
                foreignField: 'columnId',
                as: 'tasks'
              }
            },
            {
              $project: {
                _id: 1,
                title: 1,
                order: 1,
                createdAt: 1,
                updatedAt: 1,
                taskCount: { $size: '$tasks' }
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

  async createColumn(columnData: IColumnCreate): Promise<IColumn> {
    const [lastColumn] = await Column.aggregate([
      { $sort: { order: -1 } },
      { $limit: 1 }
    ]);

    const order = lastColumn ? lastColumn.order + 1 : 0;
    
    const column = new Column({
      ...columnData,
      order
    });

    return await column.save();
  }

  async updateColumn(id: string, columnData: Partial<IColumnCreate>): Promise<IColumn> {
    const column = await Column.findByIdAndUpdate(
      id,
      { $set: columnData },
      { new: true, runValidators: true }
    );

    if (!column) {
      throw new ApiError(404, 'Column not found');
    }

    return column;
  }

  async deleteColumn(id: string): Promise<void> {
    const column = await Column.findById(id);
    if (!column) {
      throw new ApiError(404, 'Column not found');
    }

    // Delete the column and its associated tasks
    await Column.deleteOne({ _id: id });
    await Task.deleteMany({ columnId: new Types.ObjectId(id) });
    
    // Update order of remaining columns
    await Column.updateMany(
      { order: { $gt: column.order } },
      { $inc: { order: -1 } }
    );
  }
}

export default new ColumnService(); 
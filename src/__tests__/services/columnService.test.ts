import mongoose from 'mongoose';
import { describe, it, expect } from '@jest/globals';
import columnService from '../../services/columnService';
import Column from '../../models/Column';
import Task from '../../models/Task';
import { IColumnCreate } from '../../types';

describe('Column Service', () => {
  describe('getAllColumns', () => {
    it('should return columns with pagination', async () => {
      // Create test data
      await Column.create([
        { title: 'To Do', order: 0 },
        { title: 'In Progress', order: 1 },
        { title: 'Done', order: 2 }
      ]);

      const result = await columnService.getAllColumns(1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(3);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('createColumn', () => {
    it('should create a column with correct order', async () => {
      const columnData: IColumnCreate = { title: 'New Column' };
      const result = await columnService.createColumn(columnData);

      expect(result.title).toBe(columnData.title);
      expect(result.order).toBe(0);
    });

    it('should set correct order when other columns exist', async () => {
      await Column.create({ title: 'Existing Column', order: 0 });
      
      const columnData: IColumnCreate = { title: 'New Column' };
      const result = await columnService.createColumn(columnData);

      expect(result.order).toBe(1);
    });
  });

  describe('updateColumn', () => {
    it('should update column details', async () => {
      const column = await Column.create({ title: 'Old Title', order: 0 });
      
      const updateData: Partial<IColumnCreate> = { title: 'New Title' };
      const result = await columnService.updateColumn(column._id.toString(), updateData);

      expect(result.title).toBe(updateData.title);
    });

    it('should throw error if column not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        columnService.updateColumn(fakeId, { title: 'New Title' })
      ).rejects.toThrow('Column not found');
    });
  });

  describe('deleteColumn', () => {
    it('should delete column and its tasks', async () => {
      const column = await Column.create({ title: 'To Delete', order: 0 });
      await Task.create({
        title: 'Task to Delete',
        columnId: column._id,
        order: 0
      });

      await columnService.deleteColumn(column._id.toString());

      const deletedColumn = await Column.findById(column._id);
      const deletedTasks = await Task.find({ columnId: column._id });

      expect(deletedColumn).toBeNull();
      expect(deletedTasks).toHaveLength(0);
    });

    it('should update order of remaining columns', async () => {
      const columns = await Column.create([
        { title: 'First', order: 0 },
        { title: 'To Delete', order: 1 },
        { title: 'Last', order: 2 }
      ]);

      await columnService.deleteColumn(columns[1]._id.toString());

      const remainingColumns = await Column.find().sort('order');
      expect(remainingColumns).toHaveLength(2);
      expect(remainingColumns[0].order).toBe(0);
      expect(remainingColumns[1].order).toBe(1);
    });
  });
}); 
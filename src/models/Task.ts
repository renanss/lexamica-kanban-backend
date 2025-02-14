import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true // Index for text search
    },
    description: {
      type: String,
      trim: true
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true // Index for faster querying tasks by column
    },
    order: {
      type: Number,
      required: true,
      index: true // Index for sorting tasks within a column
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true // Index for sorting by creation date
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    versionKey: false // Disable the version key
  }
);

// Compound index for columnId and order for efficient sorting within columns
taskSchema.index({ columnId: 1, order: 1 }, { unique: true });

// Text index for search functionality
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task; 
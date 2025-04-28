import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index for efficient sorting within columns
taskSchema.index({ columnId: 1, order: 1 }, { unique: true });

// Text index for search functionality
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task; 
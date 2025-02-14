import mongoose, { Schema } from 'mongoose';
import { IColumn } from '../types';

const columnSchema = new Schema<IColumn>(
  {
    title: {
      type: String,
      required: true,
      trim: true
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

// Compound index for ordering and uniqueness
columnSchema.index({ order: 1, title: 1 }, { unique: true });

export const Column = mongoose.model<IColumn>('Column', columnSchema);
export default Column; 
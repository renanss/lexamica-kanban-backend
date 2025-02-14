import mongoose, { Schema } from 'mongoose';
import { IColumn } from '../types';

const columnSchema = new Schema<IColumn>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true // Index for faster querying by title
    },
    order: {
      type: Number,
      required: true,
      index: true // Index for sorting columns
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

// Compound index for order and title
columnSchema.index({ order: 1, title: 1 }, { unique: true });

export const Column = mongoose.model<IColumn>('Column', columnSchema);
export default Column; 
import mongoose, { Schema } from 'mongoose';
import { ITask } from '../types';
import { wsServer } from '../index';

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

taskSchema.pre('save', function(next) {
  if (this.isNew) {
    return next();
  }
  // @ts-expect-error - _original property is dynamically added
  this._original = {
    columnId: this.columnId,
    order: this.order
  };
  next();
});

taskSchema.post('save', function(doc) {
  // @ts-expect-error - _original property is dynamically added
  if (!doc._original) {
    wsServer.broadcast('task:created', doc);
  } else {
    // @ts-expect-error - _original propertyis dynamically added
    if (!doc._original.columnId.equals(doc.columnId)) {
      wsServer.broadcast('task:moved', doc);
    } else {
      wsServer.broadcast('task:updated', doc);
    }
  }
});

taskSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    wsServer.broadcast('task:updated', doc);
  }
});

taskSchema.post('findOneAndDelete', function(doc) {
  if (doc) {
    wsServer.broadcast('task:deleted', doc._id.toString(), doc.columnId.toString());
  }
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
export default Task; 
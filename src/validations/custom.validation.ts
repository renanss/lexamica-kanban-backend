import mongoose from 'mongoose';
import { CustomHelpers } from 'joi';

type ValidationReturn = string | ReturnType<CustomHelpers['message']>;

export const objectId = (value: string, helpers: CustomHelpers): ValidationReturn => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

export const password = (value: string, helpers: CustomHelpers): ValidationReturn => {
  if (value.length < 8) {
    return helpers.error('string.min', { limit: 8 });
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('string.pattern.base', { 
      regex: '/^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$/'
    });
  }
  return value;
}; 
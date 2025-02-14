import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';
import pick from '../utils/pick';

interface ValidationSchema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

const validate = (schema: ValidationSchema) => (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }
  
  // Assign validated data to request
  Object.assign(req, value);
  return next();
};

export default validate; 
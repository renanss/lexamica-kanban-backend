import Joi from 'joi';
import { objectId } from './custom.validation';

export const createColumn = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().min(1).max(100),
    order: Joi.number().integer().min(0)
  })
};

export const updateColumn = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().min(1).max(100),
    order: Joi.number().integer().min(0)
  }).min(1)
};

export const deleteColumn = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

export const getColumn = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

export const getColumns = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
}; 
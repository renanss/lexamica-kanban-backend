import Joi from 'joi';
import { objectId } from './custom.validation';

export const createTask = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().min(1).max(200),
    description: Joi.string().trim().max(1000),
    columnId: Joi.string().custom(objectId).required(),
    order: Joi.number().integer().min(0)
  })
};

export const updateTask = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().min(1).max(200),
    description: Joi.string().trim().max(1000),
    columnId: Joi.string().custom(objectId),
    order: Joi.number().integer().min(0)
  }).min(1)
};

export const deleteTask = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

export const getTask = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

export const getTasks = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    columnId: Joi.string().custom(objectId)
  })
};

export const moveTask = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    targetColumnId: Joi.string().custom(objectId).required(),
    order: Joi.number().integer().min(0).required()
  })
}; 
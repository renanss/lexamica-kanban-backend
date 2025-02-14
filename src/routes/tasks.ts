import { Router } from 'express';
import validate from '../middleware/validate';
import * as taskValidation from '../validations/task.validation';
import * as tasksController from '../controllers/tasks';

const router = Router();

router.get('/', validate(taskValidation.getTasks), tasksController.getAllTasks);
router.get('/column/:columnId', validate(taskValidation.getTasks), tasksController.getTasksByColumn);
router.post('/', validate(taskValidation.createTask), tasksController.createTask);
router.put('/:id', validate(taskValidation.updateTask), tasksController.updateTask);
router.delete('/:id', validate(taskValidation.deleteTask), tasksController.deleteTask);
router.put('/:id/move', validate(taskValidation.moveTask), tasksController.moveTask);

export default router; 
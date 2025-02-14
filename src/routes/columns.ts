import { Router } from 'express';
import validate from '../middleware/validate';
import * as columnValidation from '../validations/column.validation';
import * as columnsController from '../controllers/columns';

const router = Router();

router.get('/', validate(columnValidation.getColumns), columnsController.getAllColumns);
router.post('/', validate(columnValidation.createColumn), columnsController.createColumn);
router.put('/:id', validate(columnValidation.updateColumn), columnsController.updateColumn);
router.delete('/:id', validate(columnValidation.deleteColumn), columnsController.deleteColumn);

export default router; 
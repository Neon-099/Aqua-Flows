
import express from 'express'
import {
    createRider,
    listRiders,
    getRiderById,
    updateAvailability,
} from '../controllers/rider.controller.js'
import {protect, authorize} from '../middlewares/auth.middleware.js'

const router = express.Router();

router.post('/', protect, authorize('admin'), createRider);
router.get('/', protect, authorize('admin'), listRiders);
router.get('/:id', protect, authorize('staff', 'rider', 'admin'), getRiderById);
router.put('/:id/availability', protect, authorize('staff', 'rider', 'admin'), updateAvailability);

export default router;

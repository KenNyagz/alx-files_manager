import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/status', AppController.getStats);
router.psot('/users', UsersController.postNew);

export default router;

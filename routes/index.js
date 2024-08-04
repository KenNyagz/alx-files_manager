import express from 'express';
import AppController'../controllers/AppController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/status', Appcontroller.getStats);

export default router;

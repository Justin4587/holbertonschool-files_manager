/* eslint-disable */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/stats', AppController.getStats);
router.get('/status', AppController.getStatus);

router.use(express.json());
router.post('/users', UsersController.postNew);


export default router;

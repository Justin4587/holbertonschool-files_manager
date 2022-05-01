/* eslint-disable */
import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

router.get('/stats', AppController.getStats);
router.get('/status', AppController.getStatus);
router.use(express.json());

export default router;

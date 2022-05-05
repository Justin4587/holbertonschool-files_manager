/* eslint-disable */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/stats', AppController.getStats);
router.get('/status', AppController.getStatus);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

router.use(express.json());
router.post('/users', UsersController.postNew);
router.post('/files', FilesController.postUpload);

export default router;

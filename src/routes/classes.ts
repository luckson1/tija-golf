
import express from 'express';
import { createClass, getAllClasses, getClass, updateClass } from '../controllers/classControllers';



const classRouter = express.Router();

classRouter.post('/',  createClass);
classRouter.get('/',  getAllClasses);
classRouter.get('/:id',  getClass);
classRouter.put('/:id',  updateClass);

export default classRouter;

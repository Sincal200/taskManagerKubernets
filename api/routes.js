
const express = require('express');
const Task = require('./modules/Task.js');
const { default: mongoose } = require('mongoose');
const router = express.Router();

router.get('/api/test', (req, res) => {
    res.json('test ok5');
});

router.post('/api/task', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const { title, description, status, datetime } = req.body;
    const task = await Task.create({ title, description, status, datetime });
    res.json(task);
});

router.get('/api/tasks', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const tasks = await Task.find({});
    res.json(tasks);
});

router.get('', async (req, res) => {
    await mongoose.connect(process.env.MONGO_URL);
    const tasks = await Task.find({});
    res.json(tasks);
});

router.delete('/api/tasks/:id', async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const result = await Task.findByIdAndDelete(req.params.id);
        if (result) {
            res.status(200).json({ message: 'Task deleted successfully', _id: req.params.id });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error });
    }
});

router.put('/api/update/tasks/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const updatedData = req.body;
        const updatedTask = await Task.findByIdAndUpdate(taskId, updatedData, { new: true });
        if (updatedTask) {
            res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error });
    }
});

router.get('/api/tasks/:status', async (req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        const status = req.params.status;
        const tasks = await Task.find({ status });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks by status', error: error });
    }
});

module.exports = router;
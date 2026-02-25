import { getTaskStatus } from '../utils/taskQueue.js';

  export const getTask = async (req, res) => {
    const taskId = req.params.id;
    const task = getTaskStatus(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.status(200).json({ success: true, data: task });
};

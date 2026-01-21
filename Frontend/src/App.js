import { useEffect, useState } from 'react';
import './App.css';
import { initializeWorker } from './Worker';
import { addNewTask, deleteTask, updateTask } from './calls';

function App() {
  const [title, setTitle] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [status, setStatus] = useState(''); 
  const [datetime, setDatetime] = useState(''); 
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [viewStatus, setViewStatus] = useState('');

  useEffect(() => {
    const worker = initializeWorker(viewStatus, setTasks);

    return () => {
      worker.terminate();
    };
  }, [viewStatus]);

  const handleAddNewTask = async (ev) => {
    ev.preventDefault();
    const task = { title, description, status, datetime };
    const json = await addNewTask(task);
    setTitle('');
    setDescription('');
    setStatus('');
    setDatetime('');
    console.log('result', json);
    setViewStatus('');
    initializeWorker(viewStatus, setTasks);
  };

  const handleDeleteTask = async (id) => {
    try {
      const data = await deleteTask(id);
      if (data.message) {
        setTasks(tasks.filter(task => task._id !== id));
        alert(data.message); 
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task."); 
    }
  };

  const handleUpdateTask = async (ev) => {
    ev.preventDefault();
    const updatedData = { title, description, status, datetime };
    try {
      const data = await updateTask(editingTask._id, updatedData);
      if (data.message) {
        setTasks(tasks.map(task => 
          task._id === editingTask._id ? data.task : task
        ));
        setEditingTask(null);
        setTitle('');
        setDescription('');
        setStatus('');
        setDatetime('');
        alert(data.message);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to update task.");
    }
  };

  const handleViewStatusChange = (ev) => {
    setViewStatus(ev.target.value);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setDatetime(task.datetime);
  };

  return (
    <main>
      <form onSubmit={editingTask ? handleUpdateTask : handleAddNewTask}>
        <div className='Title'>
          <h1>Task Manager</h1>
        </div>
        <div className='View'>
          <select value={viewStatus} onChange={handleViewStatusChange}>
            <option value="">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className='New'>
          <div className='Basics'>
            <input 
              type="text" 
              value={title}
              onChange={ev => setTitle(ev.target.value)} 
              placeholder={'New Task'}
            />
            <input 
              value={datetime} 
              onChange={ev => setDatetime(ev.target.value)}
              type="datetime-local"
            />
          </div>
          <div className='Description'>
            <input 
              value={description} 
              onChange={ev => setDescription(ev.target.value)}
              type="text" 
              placeholder={'Description'}
            />
          </div>
          <div className='Status'>
            <select 
              value={status} 
              onChange={ev => setStatus(ev.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type='submit'>{editingTask ? 'Update Task' : 'Add new Task'}</button>
        </div>
      </form>
      <div className='Tasks'>
        {tasks.length > 0 && tasks.map((task) => (
          <div key={task._id}>
            <div className='Task'>
              <div className='left'>
                <div className='title'>{task.title}</div>
                <div className='description'>{task.description}</div>
              </div>
              <div className='right'>
                <div className='datetime'>{task.datetime}</div>
                <div className={'status ' + (task.status === "Completed" ? 'green' : task.status === "In Progress" ? 'yellow' : 'red')}>
                  {task.status}
                </div> 
                <button className='actions' onClick={() => handleDeleteTask(task._id)}>Delete</button>
                <button className='actions' onClick={() => handleEditClick(task)}>Edit</button>
              </div>
            </div>
          </div>
        ))}    
      </div>  
    </main>
  );
}

export default App;
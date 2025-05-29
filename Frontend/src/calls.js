
const API_URL = process.env.REACT_APP_API_URL;

export const addNewTask = async (task) => {
  const response = await fetch(`${API_URL}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
};

export const deleteTask = async (id) => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const updateTask = async (id, updatedData) => {
  const response = await fetch(`${API_URL}/update/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  return response.json();
};
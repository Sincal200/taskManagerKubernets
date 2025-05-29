// Web Workers para realizar la tarea de carga de datos por separado del hilo principal que es la interfaz grafica
/* eslint-disable no-restricted-globals */
self.onmessage = async function (e) {
    const { type, payload } = e.data;
  
    switch (type) {
      case 'FETCH_TASKS':
        const tasks = await fetchTasks(payload.status);
        self.postMessage({ type: 'FETCH_TASKS_SUCCESS', tasks });
        break;
        
      default:
        break;
    }
  };

  /* eslint-disable no-restricted-globals */
async function fetchTasks(status = '') {
    const url = status 
        ? process.env.REACT_APP_API_URL+`/tasks/${status}`
        : process.env.REACT_APP_API_URL+'/tasks';
    const response = await fetch(url);
    return await response.json();
}



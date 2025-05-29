
export function initializeWorker(viewStatus, setTasks) {
    const worker = new Worker(new URL('./taskWorker.js', import.meta.url));
    worker.postMessage({ type: 'FETCH_TASKS', payload: { status: viewStatus } });
  
    worker.onmessage = function (e) {
      const { type, tasks } = e.data;
      if (type === 'FETCH_TASKS_SUCCESS') {
        setTasks(tasks);
      }
    };
  
    return worker;
  }
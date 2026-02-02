import { useEffect, useState } from 'react';
import { Task } from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    try {
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async (data: { title: string; description: string }) => {
    try {
      await api.createTask(data);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a létrehozásnál');
    }
  };

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      await api.updateTask(id, { completed });
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a frissítésnél');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTask(id);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a törlésnél');
    }
  };

  return (
    <div className="app">
      <Header />
      <main className="container">
        <TaskForm onSubmit={handleCreate} />
        {error && <div className="error">{error}</div>}
        {loading ? (
          <p className="loading">Betöltés...</p>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';

interface TaskFormProps {
  onSubmit: (data: { title: string; description: string }) => void;
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim() });
    setTitle('');
    setDescription('');
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Feladat neve..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Leírás (opcionális)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Hozzáadás</button>
    </form>
  );
}

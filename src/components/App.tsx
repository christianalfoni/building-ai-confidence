import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { Input } from "../ui-components/Input";
import { Checkbox } from "../ui-components/Checkbox";
import { IconButton } from "../ui-components/IconButton";
import type { Todo } from "../state/AppState";

export function App() {
  const app = useApp();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    app.addTodo(newText);
    setNewText("");
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  function commitEdit(id: string) {
    if (!editText.trim()) return;
    app.editTodo(id, editText);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex flex-col gap-4 shadow-sm w-full max-w-md">
        <h1 className="text-2xl font-semibold text-navy">Todos</h1>
        <Input
          placeholder="Add a todo and press Enter…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={handleAddKeyDown}
        />
        {app.todos.length === 0 ? (
          <p className="text-navy/50 text-sm text-center py-4">No todos yet</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {app.todos.map(todo => (
              <li key={todo.id} className="flex items-center gap-3">
                <Checkbox
                  checked={todo.completed}
                  onChange={() => app.toggleTodo(todo.id)}
                />
                {editingId === todo.id ? (
                  <Input
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitEdit(todo.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    onBlur={() => commitEdit(todo.id)}
                    autoFocus
                    className="flex-1"
                  />
                ) : (
                  <span
                    className={`flex-1 text-navy ${todo.completed ? "line-through text-navy/40" : ""}`}
                  >
                    {todo.text}
                  </span>
                )}
                {editingId !== todo.id && (
                  <>
                    <IconButton onClick={() => startEdit(todo)} aria-label="Edit">
                      ✎
                    </IconButton>
                    <IconButton onClick={() => app.deleteTodo(todo.id)} aria-label="Delete">
                      ×
                    </IconButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

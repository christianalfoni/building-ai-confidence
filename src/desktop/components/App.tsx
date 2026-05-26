import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { Input } from "../ui-components/Input";
import { Checkbox } from "../ui-components/Checkbox";
import { IconButton } from "../ui-components/IconButton";
import type { Todo } from "../../state/AppState";

export function App() {
  const app = useApp();
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const completedCount = app.todos.filter(t => t.completed).length;

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
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-surface px-8 py-4 flex items-center gap-3">
        <span className="text-crimson font-bold text-lg">◈</span>
        <span className="font-semibold text-navy text-sm">Building AI Confidence</span>
        {app.todos.length > 0 && (
          <span className="ml-auto text-sm text-navy/50">
            {completedCount} of {app.todos.length} complete
          </span>
        )}
      </header>
      <main className="flex-1 px-8 py-8 max-w-2xl w-full mx-auto">
        <Input
          placeholder="Add a todo and press Enter…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={handleAddKeyDown}
          className="mb-4"
        />
        {app.todos.length > 0 && (
          <ul className="flex flex-col divide-y divide-surface">
            {app.todos.map(todo => (
              <li key={todo.id} className="flex items-center gap-3 py-3">
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
        {app.todos.length === 0 && (
          <p className="text-navy/50 text-sm py-4">No todos yet — add one above.</p>
        )}
      </main>
    </div>
  );
}

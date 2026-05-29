import { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { Input } from "../ui-components/Input";
import { Checkbox } from "../ui-components/Checkbox";
import { IconButton } from "../ui-components/IconButton";
import type { Todo } from "../../state/AppState";

function TodoItem({ todo }: { todo: Todo }) {
  const app = useApp();
  const isEditing = app.editingId === todo.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <li className="flex items-center gap-3 py-3">
      <Checkbox
        checked={todo.completed}
        onChange={() => app.toggleTodo(todo.id)}
        disabled={isEditing}
      />
      <input
        ref={inputRef}
        readOnly={!isEditing}
        value={isEditing ? app.editText : todo.text}
        onChange={e => { if (isEditing) app.setEditText(e.target.value); }}
        onKeyDown={e => {
          if (!isEditing) return;
          if (e.key === "Enter") app.commitEdit();
          if (e.key === "Escape") app.cancelEdit();
        }}
        onBlur={() => { if (isEditing) app.cancelEdit(); }}
        onClick={() => { if (!isEditing) app.startEdit(todo.id); }}
        className={`flex-1 bg-transparent border-none outline-none p-0 focus:ring-0 cursor-text ${
          todo.completed ? "line-through text-navy/40" : "text-navy"
        }`}
      />
      <IconButton
        onClick={() => app.deleteTodo(todo.id)}
        aria-label="Delete"
        disabled={isEditing}
      >
        <Trash2 className="w-4 h-4" />
      </IconButton>
    </li>
  );
}

export function App() {
  const app = useApp();
  const completedCount = app.todos.filter(t => t.completed).length;

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
          value={app.newTodoText}
          onChange={e => app.setNewTodoText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") app.submitNewTodo();
          }}
          className="mb-4"
        />
        {app.todos.length > 0 && (
          <ul className="flex flex-col divide-y divide-surface">
            {app.todos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
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

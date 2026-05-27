import { useApp } from "../../contexts/AppContext";
import { Input } from "../ui-components/Input";
import { Checkbox } from "../ui-components/Checkbox";
import { IconButton } from "../ui-components/IconButton";

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
              <li key={todo.id} className="flex items-center gap-3 py-3">
                <Checkbox
                  checked={todo.completed}
                  onChange={() => app.toggleTodo(todo.id)}
                  disabled={app.editingId === todo.id}
                />
                {app.editingId === todo.id ? (
                  <Input
                    value={app.editText}
                    onChange={e => app.setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") app.commitEdit();
                      if (e.key === "Escape") app.cancelEdit();
                    }}
                    onBlur={() => app.commitEdit()}
                    autoFocus
                    className="flex-1"
                  />
                ) : (
                  <span
                    className={`flex-1 text-navy cursor-text ${todo.completed ? "line-through text-navy/40" : ""}`}
                    onClick={() => app.startEdit(todo.id)}
                  >
                    {todo.text}
                  </span>
                )}
                {app.editingId !== todo.id && (
                  <IconButton onClick={() => app.deleteTodo(todo.id)} aria-label="Delete">
                    ×
                  </IconButton>
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

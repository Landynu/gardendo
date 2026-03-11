import {
  useQuery,
  getProperties,
  getTasks,
  updateTask,
  createTask,
} from "wasp/client/operations"
import { Link } from "react-router"
import {
  Leaf,
  CheckSquare,
  Plus,
  Circle,
  CheckCircle2,
  Clock,
  SkipForward,
  X,
} from "lucide-react"
import { useState } from "react"

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
] as const

const priorityStyles: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: "bg-red-100", text: "text-red-700" },
  HIGH: { bg: "bg-orange-100", text: "text-orange-700" },
  MEDIUM: { bg: "bg-accent-100", text: "text-accent-700" },
  LOW: { bg: "bg-neutral-100", text: "text-neutral-600" },
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Circle className="h-5 w-5 text-neutral-400" />,
  IN_PROGRESS: <Clock className="h-5 w-5 text-blue-500" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5 text-primary-500" />,
  SKIPPED: <SkipForward className="h-5 w-5 text-neutral-300" />,
}

const nextStatus: Record<string, string> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "PENDING",
  SKIPPED: "PENDING",
}

export function TasksPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [showAddTask, setShowAddTask] = useState(false)

  const queryArgs =
    property && statusFilter !== "ALL"
      ? { propertyId: property.id, status: statusFilter }
      : property
        ? { propertyId: property.id }
        : undefined

  const { data: tasks, isLoading: tasksLoading } = useQuery(
    getTasks,
    queryArgs,
    { enabled: !!property }
  )

  const isLoading = propsLoading || tasksLoading

  async function handleToggleStatus(task: any) {
    const newStatus = nextStatus[task.status] ?? "PENDING"
    try {
      await updateTask({
        id: task.id,
        status: newStatus,
      })
    } catch (err) {
      console.error("Failed to update task:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare className="mb-4 h-16 w-16 text-neutral-300" />
          <p className="text-neutral-500">
            Create a property first to manage tasks.
          </p>
          <Link to="/settings" className="btn-primary mt-4">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Tasks</h1>
        <button onClick={() => setShowAddTask(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {showAddTask && property && (
        <CreateTaskForm
          propertyId={property.id}
          onClose={() => setShowAddTask(false)}
        />
      )}

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">No tasks found</p>
          {statusFilter !== "ALL" && (
            <p className="mt-1 text-sm text-neutral-400">
              Try selecting a different status filter
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: any) => {
            const pStyle = priorityStyles[task.priority] ?? priorityStyles.MEDIUM

            return (
              <div
                key={task.id}
                className={`card flex items-center gap-3 p-4 ${
                  task.status === "COMPLETED" ? "opacity-60" : ""
                }`}
              >
                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="shrink-0 transition-transform hover:scale-110"
                  title={`Status: ${task.status} (click to change)`}
                >
                  {statusIcons[task.status] ?? statusIcons.PENDING}
                </button>

                {/* Task Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      task.status === "COMPLETED"
                        ? "text-neutral-400 line-through"
                        : "text-neutral-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="mt-0.5 truncate text-xs text-neutral-400">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {task.dueDate && (
                      <span className="text-xs text-neutral-400">
                        Due {task.dueDate}
                      </span>
                    )}
                    {task.calendarEvent && (
                      <span className="text-xs text-neutral-300">
                        {"\u00B7"} {task.calendarEvent.title}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="text-xs text-neutral-300">
                        {"\u00B7"} {task.assignee.username}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${pStyle.bg} ${pStyle.text}`}
                >
                  {task.priority.toLowerCase()}
                </span>

                {/* Status Badge */}
                <span
                  className={`hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex ${
                    task.status === "COMPLETED"
                      ? "bg-primary-100 text-primary-700"
                      : task.status === "IN_PROGRESS"
                        ? "bg-blue-100 text-blue-700"
                        : task.status === "SKIPPED"
                          ? "bg-neutral-100 text-neutral-500"
                          : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {task.status.replace("_", " ").toLowerCase()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateTaskForm({
  propertyId,
  onClose,
}: {
  propertyId: string
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTask({
        propertyId,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
      })
      onClose()
    } catch (err) {
      console.error("Failed to create task:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">New Task</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label mb-1 block">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Start tomato seeds indoors"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="label mb-1 block">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Optional details..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label mb-1 block">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title}
            className="btn-primary"
          >
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  )
}

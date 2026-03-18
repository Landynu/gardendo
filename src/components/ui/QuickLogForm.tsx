import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

type Props = {
  title: string
  open: boolean
  onToggle: () => void
  onSubmit: () => Promise<void>
  saving: boolean
  children: React.ReactNode
}

export function QuickLogForm({ title, open, onToggle, onSubmit, saving, children }: Props) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit()
  }

  return (
    <div className="card mb-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="border-t border-neutral-200 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

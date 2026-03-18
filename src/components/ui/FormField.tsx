type Props = {
  label: string
  required?: boolean
  help?: string
  children: React.ReactNode
}

export function FormField({ label, required, help, children }: Props) {
  return (
    <div>
      <label className="label mb-1 block">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-neutral-500">{help}</p>}
    </div>
  )
}

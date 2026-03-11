import { type CreateTask, type UpdateTask } from "wasp/server/operations"
import { type Task } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateTaskArgs = {
  propertyId: string
  title: string
  description?: string
  priority?: string
  dueDate?: string
  recurrence?: string
  calendarEventId?: string
  notes?: string
}

export const createTask: CreateTask<CreateTaskArgs, Task> = async (
  args,
  context
) => {
  await requirePropertyMember(context, args.propertyId)

  return context.entities.Task.create({
    data: {
      title: args.title,
      description: args.description,
      priority: (args.priority as any) ?? "MEDIUM",
      dueDate: args.dueDate,
      recurrence: (args.recurrence as any) ?? "NONE",
      calendarEventId: args.calendarEventId,
      notes: args.notes,
      propertyId: args.propertyId,
      assigneeId: context.user!.id,
    },
  })
}

type UpdateTaskArgs = {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: string
  dueDate?: string
  recurrence?: string
  notes?: string
}

export const updateTask: UpdateTask<UpdateTaskArgs, Task> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  const { id, status, ...rest } = args

  const data: any = { ...rest }

  if (status) {
    data.status = status
    if (status === "COMPLETED") {
      data.completedAt = new Date()
    }
  }

  return context.entities.Task.update({
    where: { id },
    data,
  })
}

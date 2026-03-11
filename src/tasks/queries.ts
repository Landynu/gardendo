import { type GetTasks } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetTasksArgs = {
  propertyId: string
  status?: string
}

export const getTasks: GetTasks<GetTasksArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }

  if (args.status) {
    where.status = args.status
  }

  return context.entities.Task.findMany({
    where,
    include: {
      assignee: true,
      calendarEvent: true,
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  })
}

import { type GenerateDailyTasks } from "wasp/server/jobs"
import { format } from "date-fns"

export const generateDailyTasks: GenerateDailyTasks<
  Record<string, never>,
  void
> = async (_args, context) => {
  const todayStr = format(new Date(), "yyyy-MM-dd")

  // 1. Get all properties
  const properties = await context.entities.Property.findMany({
    include: {
      members: true,
    },
  })

  for (const property of properties) {
    // 2. Find today's calendar events for this property
    const events = await context.entities.CalendarEvent.findMany({
      where: {
        propertyId: property.id,
        date: todayStr,
      },
    })

    // Find the first OWNER member to assign tasks to
    const owner = property.members.find(
      (m: any) => m.role === "OWNER"
    )

    if (!owner) {
      // No owner found for this property, skip
      continue
    }

    for (const event of events) {
      // 3. Build a generation key to prevent duplicate tasks
      const generationKey = `task:${event.id}:${todayStr}`

      // 4. Check if a task with this generation key already exists
      const existingTask = await context.entities.Task.findUnique({
        where: { generationKey },
      })

      if (existingTask) {
        // Task already generated for this event today, skip
        continue
      }

      // 5. Create the task
      await context.entities.Task.create({
        data: {
          title: event.title,
          description: event.description ?? undefined,
          status: "PENDING",
          priority: "MEDIUM",
          dueDate: todayStr,
          generationKey,
          assigneeId: owner.userId,
          propertyId: property.id,
          calendarEventId: event.id,
        },
      })
    }
  }
}

import { HttpError } from "wasp/server"

export async function requirePropertyMember(
  context: any,
  propertyId: string
): Promise<void> {
  if (!context.user) throw new HttpError(401)
  const member = await context.entities.PropertyMember.findFirst({
    where: { userId: context.user.id, propertyId },
  })
  if (!member) throw new HttpError(403, "Not a member of this property")
}

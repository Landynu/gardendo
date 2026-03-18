import { type GetPendingInvitations } from "wasp/server/operations";
import { HttpError } from "wasp/server";

type GetPendingArgs = { propertyId: string };

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
};

export const getPendingInvitations: GetPendingInvitations<
  GetPendingArgs,
  InvitationRow[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  // Verify caller is OWNER
  const membership = await context.entities.PropertyMember.findFirst({
    where: { userId: context.user.id, propertyId: args.propertyId },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new HttpError(403, "Only property owners can view invitations");
  }

  return context.entities.PropertyInvitation.findMany({
    where: {
      propertyId: args.propertyId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

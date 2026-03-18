import {
  type InviteToProperty,
  type AcceptInvitation,
  type CancelInvitation,
} from "wasp/server/operations";
import { HttpError } from "wasp/server";
import { emailSender } from "wasp/server/email";

// ─── INVITE TO PROPERTY ────────────────────

type InviteArgs = {
  email: string;
  propertyId: string;
  role?: string;
};

export const inviteToProperty: InviteToProperty<InviteArgs, void> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  // Verify caller is OWNER
  const membership = await context.entities.PropertyMember.findFirst({
    where: { userId: context.user.id, propertyId: args.propertyId },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new HttpError(403, "Only property owners can invite members");
  }

  const email = args.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new HttpError(400, "Invalid email address");
  }

  // Check if already a member
  const existingMember = await context.entities.PropertyMember.findFirst({
    where: {
      propertyId: args.propertyId,
      user: { auth: { identities: { some: { providerUserId: email } } } },
    },
  });
  if (existingMember) {
    throw new HttpError(400, "This person is already a member");
  }

  // Check for existing pending invitation
  const existingInvite = await context.entities.PropertyInvitation.findFirst({
    where: {
      email,
      propertyId: args.propertyId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    throw new HttpError(400, "An invitation is already pending for this email");
  }

  const property = await context.entities.Property.findUnique({
    where: { id: args.propertyId },
  });
  if (!property) throw new HttpError(404, "Property not found");

  // Create invitation (7-day expiry)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await context.entities.PropertyInvitation.create({
    data: {
      email,
      propertyId: args.propertyId,
      invitedByUserId: context.user.id,
      role: (args.role === "OWNER" ? "OWNER" : "MEMBER") as any,
      expiresAt,
    },
  });

  // Send invitation email
  const appUrl = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/accept-invite?token=${invitation.token}`;

  try {
    await emailSender.send({
      to: email,
      subject: `You're invited to ${property.name} on GardenDo`,
      text: `You've been invited to join "${property.name}" on GardenDo.\n\nClick here to accept: ${inviteUrl}\n\nThis invitation expires in 7 days.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">🌱 GardenDo Invitation</h2>
          <p>You've been invited to join <strong>${property.name}</strong> on GardenDo.</p>
          <p>
            <a href="${inviteUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send invitation email:", err);
    // Don't throw — invitation is created, user can share the link manually
  }
};

// ─── ACCEPT INVITATION ─────────────────────

type AcceptArgs = { token: string };
type AcceptResult = { propertyName: string };

export const acceptInvitation: AcceptInvitation<
  AcceptArgs,
  AcceptResult
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const invitation = await context.entities.PropertyInvitation.findUnique({
    where: { token: args.token },
    include: { property: true },
  });

  if (!invitation) {
    throw new HttpError(404, "Invitation not found");
  }
  if (invitation.acceptedAt) {
    throw new HttpError(400, "Invitation already accepted");
  }
  if (invitation.expiresAt < new Date()) {
    throw new HttpError(400, "Invitation has expired");
  }

  // Check if already a member
  const existing = await context.entities.PropertyMember.findFirst({
    where: { userId: context.user.id, propertyId: invitation.propertyId },
  });
  if (existing) {
    // Already a member — mark invitation as accepted and return
    await context.entities.PropertyInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return { propertyName: invitation.property.name };
  }

  // Create membership and mark accepted
  await context.entities.PropertyMember.create({
    data: {
      userId: context.user.id,
      propertyId: invitation.propertyId,
      role: invitation.role,
    },
  });

  await context.entities.PropertyInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  return { propertyName: invitation.property.name };
};

// ─── CANCEL INVITATION ─────────────────────

type CancelArgs = { invitationId: string; propertyId: string };

export const cancelInvitation: CancelInvitation<CancelArgs, void> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  // Verify caller is OWNER
  const membership = await context.entities.PropertyMember.findFirst({
    where: { userId: context.user.id, propertyId: args.propertyId },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new HttpError(403, "Only property owners can cancel invitations");
  }

  await context.entities.PropertyInvitation.delete({
    where: { id: args.invitationId },
  });
};

# Auth System

## Overview

GardenDo uses WASP's built-in email authentication with Postmark SMTP for email verification and password reset. All data is scoped to properties via the PropertyMember join table.

## Authentication

### WASP Email Auth
- Email/password registration with email verification
- Password reset via email
- Configured in main.wasp `app.auth` block
- SMTP via Postmark (env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`)

### Key Files
- `main.wasp` — Auth configuration (userEntity, methods, redirects, email templates)
- `src/auth/` — Auth page components (LoginPage, SignupPage, EmailVerification, PasswordReset, RequestPasswordReset)

## Authorization

### Property Scoping
All data belongs to a Property. Users access properties through PropertyMember membership.

```
User → PropertyMember (role: OWNER | MEMBER) → Property → [all property data]
```

### Auth Guard Pattern
Every query/action follows this pattern:

```typescript
export const myOperation = async (args, context) => {
  // 1. Check authentication
  if (!context.user) throw new HttpError(401, 'Not authorized')

  // 2. Check property membership (for property-scoped operations)
  await requirePropertyMember(context, args.propertyId)

  // 3. Proceed with operation
}
```

### `requirePropertyMember` Helper
Located in `src/lib/auth.ts`. Verifies the current user is a member of the specified property. Throws HttpError 403 if not.

## Member Invitation System

### Flow
1. Property OWNER sends invitation via email
2. System creates `PropertyInvitation` record with expiration
3. Recipient receives email with accept link
4. Recipient signs up (if needed) and accepts invitation
5. System creates `PropertyMember` record with MEMBER role

### Key Operations
- `inviteToProperty` — Creates invitation, (future: sends email)
- `acceptInvitation` — Creates membership from valid invitation
- `cancelInvitation` — Removes pending invitation
- `getPendingInvitations` — Lists active invitations for a property

## Roles

| Role | Capabilities |
|---|---|
| OWNER | Full access, can invite/remove members, manage property settings |
| MEMBER | Read/write access to property data, cannot manage members |

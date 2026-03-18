import {
  type SaveDesignHistory,
  type SaveAiChatSession,
  type GetAiChatSession,
} from "wasp/server/operations";
import {
  type BedDesignHistory,
  type AiChatSession,
} from "wasp/entities";
import { HttpError } from "wasp/server";
import { requirePropertyMember } from "../lib/auth";

// ─── Helper: auth check via bed → zone → property ───

async function requireBedAccess(
  context: any,
  bedId: string,
): Promise<string> {
  const bed = await context.entities.GardenBed.findUnique({
    where: { id: bedId },
    include: { zone: true },
  });
  if (!bed) throw new HttpError(404, "Bed not found");
  await requirePropertyMember(context, bed.zone.propertyId);
  return bed.zone.propertyId;
}

// ─── saveDesignHistory ──────────────────────────────

type SaveDesignHistoryArgs = {
  bedId: string;
  year: number;
  season: string;
  layoutJson: string;
  prompt: string;
  explanation?: string;
  successionNotes?: string;
};

export const saveDesignHistory: SaveDesignHistory<
  SaveDesignHistoryArgs,
  BedDesignHistory
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  await requireBedAccess(context, args.bedId);

  return context.entities.BedDesignHistory.create({
    data: {
      bedId: args.bedId,
      year: args.year,
      season: args.season as any,
      layoutJson: args.layoutJson,
      prompt: args.prompt,
      explanation: args.explanation ?? null,
      successionNotes: args.successionNotes ?? null,
    },
  });
};

// ─── getAiChatSession ───────────────────────────────

type GetAiChatSessionArgs = {
  bedId: string;
  year: number;
  season: string;
};

export const getAiChatSession: GetAiChatSession<
  GetAiChatSessionArgs,
  AiChatSession | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  await requireBedAccess(context, args.bedId);

  return context.entities.AiChatSession.findUnique({
    where: {
      bedId_year_season: {
        bedId: args.bedId,
        year: args.year,
        season: args.season as any,
      },
    },
  });
};

// ─── saveAiChatSession ──────────────────────────────

type SaveAiChatSessionArgs = {
  bedId: string;
  year: number;
  season: string;
  messagesJson: string;
};

export const saveAiChatSession: SaveAiChatSession<
  SaveAiChatSessionArgs,
  AiChatSession
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  await requireBedAccess(context, args.bedId);

  return context.entities.AiChatSession.upsert({
    where: {
      bedId_year_season: {
        bedId: args.bedId,
        year: args.year,
        season: args.season as any,
      },
    },
    create: {
      bedId: args.bedId,
      year: args.year,
      season: args.season as any,
      messagesJson: args.messagesJson,
    },
    update: {
      messagesJson: args.messagesJson,
    },
  });
};

import {
  type CreateZone,
  type CreateBed,
  type SaveBedSquares,
} from "wasp/server/operations"
import { type PropertyZone, type GardenBed, type BedSquare } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { getActiveCells, type BedShape } from "../lib/bedShapes"

// ─── createZone ─────────────────────────────

type CreateZoneArgs = {
  propertyId: string
  name: string
  permZone: string
  description?: string
  areaSqFt?: number
  notes?: string
}

export const createZone: CreateZone<CreateZoneArgs, PropertyZone> = async (
  args,
  context
) => {
  await requirePropertyMember(context, args.propertyId)

  return context.entities.PropertyZone.create({
    data: {
      name: args.name,
      permZone: args.permZone as any,
      description: args.description,
      areaSqFt: args.areaSqFt,
      notes: args.notes,
      propertyId: args.propertyId,
    },
  })
}

// ─── createBed ──────────────────────────────

type CreateBedArgs = {
  zoneId: string
  name: string
  widthFt: number
  lengthFt: number
  shape?: string
  bedType?: string
  heightIn?: number
  soilType?: string
  notes?: string
}

export const createBed: CreateBed<CreateBedArgs, GardenBed> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  const zone = await context.entities.PropertyZone.findUnique({
    where: { id: args.zoneId },
  })
  if (!zone) throw new HttpError(404, "Zone not found")

  await requirePropertyMember(context, zone.propertyId)

  return context.entities.GardenBed.create({
    data: {
      name: args.name,
      widthFt: args.widthFt,
      lengthFt: args.lengthFt,
      shape: (args.shape as any) ?? undefined,
      bedType: (args.bedType as any) ?? undefined,
      heightIn: args.heightIn ?? undefined,
      soilType: args.soilType,
      notes: args.notes,
      zoneId: args.zoneId,
    },
  })
}

// ─── saveBedSquares ─────────────────────────

type SquareInput = {
  row: number
  col: number
  plantId: string | null
}

type SaveBedSquaresArgs = {
  bedId: string
  year: number
  season: string
  squares: SquareInput[]
}

export const saveBedSquares: SaveBedSquares<SaveBedSquaresArgs, BedSquare[]> =
  async (args, context) => {
    if (!context.user) throw new HttpError(401)

    // Verify membership via bed -> zone -> property
    const bed = await context.entities.GardenBed.findUnique({
      where: { id: args.bedId },
      include: { zone: true },
    })
    if (!bed) throw new HttpError(404, "Bed not found")

    await requirePropertyMember(context, bed.zone.propertyId)

    // Filter squares to only active cells for the bed's shape
    const activeCells = getActiveCells(bed.widthFt, bed.lengthFt, bed.shape as BedShape)
    args.squares = args.squares.filter(sq => activeCells.has(`${sq.row}-${sq.col}`))

    // Delete existing squares for this bed/year/season
    await context.entities.BedSquare.deleteMany({
      where: {
        bedId: args.bedId,
        year: args.year,
        season: args.season as any,
      },
    })

    // Group squares by plantId to create/reuse Planting records
    const squaresByPlantId = new Map<string, SquareInput[]>()
    const emptySquares: SquareInput[] = []

    for (const sq of args.squares) {
      if (sq.plantId) {
        const existing = squaresByPlantId.get(sq.plantId)
        if (existing) {
          existing.push(sq)
        } else {
          squaresByPlantId.set(sq.plantId, [sq])
        }
      } else {
        emptySquares.push(sq)
      }
    }

    // For each plantId group, find or create a Planting record
    const plantingMap = new Map<string, string>() // plantId -> plantingId

    for (const [plantId, _squares] of squaresByPlantId) {
      // Try to reuse an existing planting for this bed/plant/year/season
      let planting = await context.entities.Planting.findFirst({
        where: {
          bedId: args.bedId,
          plantId,
          year: args.year,
          season: args.season as any,
        },
      })

      if (!planting) {
        planting = await context.entities.Planting.create({
          data: {
            plantId,
            bedId: args.bedId,
            year: args.year,
            season: args.season as any,
          },
        })
      }

      plantingMap.set(plantId, planting.id)
    }

    // Create new BedSquare records
    const createdSquares: BedSquare[] = []

    for (const sq of args.squares) {
      const plantingId = sq.plantId
        ? plantingMap.get(sq.plantId) ?? null
        : null

      const created = await context.entities.BedSquare.create({
        data: {
          row: sq.row,
          col: sq.col,
          year: args.year,
          season: args.season as any,
          bedId: args.bedId,
          plantingId,
        },
      })

      createdSquares.push(created)
    }

    return createdSquares
  }

import {
  type CreateAnimalGroup,
  type CreateAnimal,
  type CreateHealthRecord,
  type CreateEggLog,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateAnimalGroupArgs = {
  propertyId: string
  name: string
  animalType: string
  notes?: string
}

export const createAnimalGroup: CreateAnimalGroup<CreateAnimalGroupArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.AnimalGroup.create({
    data: {
      name: args.name,
      animalType: args.animalType as any,
      notes: args.notes,
      propertyId: args.propertyId,
    },
  })
}

type CreateAnimalArgs = {
  propertyId: string
  groupId: string
  name?: string
  breed?: string
  dateOfBirth?: string
  dateAcquired?: string
  notes?: string
}

export const createAnimal: CreateAnimal<CreateAnimalArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  // Verify group belongs to property
  const group = await context.entities.AnimalGroup.findUnique({
    where: { id: args.groupId },
  })
  if (!group || group.propertyId !== args.propertyId) throw new HttpError(403)

  return context.entities.Animal.create({
    data: {
      name: args.name,
      breed: args.breed,
      dateOfBirth: args.dateOfBirth,
      dateAcquired: args.dateAcquired,
      notes: args.notes,
      groupId: args.groupId,
    },
  })
}

type CreateHealthRecordArgs = {
  propertyId: string
  animalId: string
  date: string
  description: string
  treatment?: string
  notes?: string
}

export const createHealthRecord: CreateHealthRecord<CreateHealthRecordArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  // Verify animal belongs to property via group
  const animal = await context.entities.Animal.findUnique({
    where: { id: args.animalId },
    include: { group: true },
  })
  if (!animal || animal.group.propertyId !== args.propertyId) throw new HttpError(403)

  return context.entities.AnimalHealthRecord.create({
    data: {
      date: args.date,
      description: args.description,
      treatment: args.treatment,
      notes: args.notes,
      animalId: args.animalId,
    },
  })
}

type CreateEggLogArgs = {
  propertyId: string
  groupId: string
  date: string
  count: number
  notes?: string
}

export const createEggLog: CreateEggLog<CreateEggLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  // Verify group belongs to property
  const group = await context.entities.AnimalGroup.findUnique({
    where: { id: args.groupId },
  })
  if (!group || group.propertyId !== args.propertyId) throw new HttpError(403)

  return context.entities.EggLog.create({
    data: {
      date: args.date,
      count: args.count,
      notes: args.notes,
      groupId: args.groupId,
    },
  })
}

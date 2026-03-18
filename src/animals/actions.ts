import {
  type CreateAnimalGroup,
  type UpdateAnimalGroup,
  type DeleteAnimalGroup,
  type CreateAnimal,
  type UpdateAnimal,
  type CreateHealthRecord,
  type DeleteHealthRecord,
  type CreateEggLog,
  type DeleteEggLog,
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

// ─── Update / Delete operations ─────────────

type UpdateAnimalGroupArgs = {
  id: string
  propertyId: string
  name?: string
  notes?: string
}

export const updateAnimalGroup: UpdateAnimalGroup<UpdateAnimalGroupArgs, any> = async (
  args, context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  const { id, propertyId, ...data } = args
  return context.entities.AnimalGroup.update({ where: { id }, data })
}

type DeleteAnimalGroupArgs = { id: string; propertyId: string }

export const deleteAnimalGroup: DeleteAnimalGroup<DeleteAnimalGroupArgs, any> = async (
  args, context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  return context.entities.AnimalGroup.delete({ where: { id: args.id } })
}

type UpdateAnimalArgs = {
  id: string
  propertyId: string
  name?: string
  breed?: string
  isActive?: boolean
  notes?: string
}

export const updateAnimal: UpdateAnimal<UpdateAnimalArgs, any> = async (
  args, context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  const { id, propertyId, ...data } = args
  return context.entities.Animal.update({ where: { id }, data })
}

type DeleteHealthRecordArgs = { id: string; propertyId: string }

export const deleteHealthRecord: DeleteHealthRecord<DeleteHealthRecordArgs, any> = async (
  args, context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  return context.entities.AnimalHealthRecord.delete({ where: { id: args.id } })
}

type DeleteEggLogArgs = { id: string; propertyId: string }

export const deleteEggLog: DeleteEggLog<DeleteEggLogArgs, any> = async (
  args, context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  return context.entities.EggLog.delete({ where: { id: args.id } })
}

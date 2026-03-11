import { type GetUploadUrl } from "wasp/server/operations"
import { type Photo } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { getPresignedUploadUrl } from "../lib/s3"
import crypto from "crypto"

type GetUploadUrlArgs = {
  propertyId: string
  contentType?: string
  caption?: string
  takenAt?: string
  zoneId?: string
  bedId?: string
  taskId?: string
  animalId?: string
  harvestLogId?: string
  inventoryId?: string
  plantId?: string
}

type GetUploadUrlResult = {
  photo: Photo
  uploadUrl: string
}

export const getUploadUrl: GetUploadUrl<
  GetUploadUrlArgs,
  GetUploadUrlResult
> = async (args, context) => {
  await requirePropertyMember(context, args.propertyId)

  const key = `photos/${args.propertyId}/${crypto.randomUUID()}`

  const photo = await context.entities.Photo.create({
    data: {
      key,
      caption: args.caption,
      takenAt: args.takenAt,
      propertyId: args.propertyId,
      zoneId: args.zoneId,
      bedId: args.bedId,
      taskId: args.taskId,
      animalId: args.animalId,
      harvestLogId: args.harvestLogId,
      inventoryId: args.inventoryId,
      plantId: args.plantId,
    },
  })

  const uploadUrl = await getPresignedUploadUrl(
    key,
    args.contentType || "image/*"
  )

  return { photo, uploadUrl }
}

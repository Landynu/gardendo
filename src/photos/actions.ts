import { type GetUploadUrl } from "wasp/server/operations"
import { type Photo } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import crypto from "crypto"

type GetUploadUrlArgs = {
  propertyId: string
  caption?: string
  takenAt?: string
  zoneId?: string
  bedId?: string
  taskId?: string
  animalId?: string
  harvestLogId?: string
  inventoryId?: string
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
    },
  })

  // TODO: Generate a presigned S3 upload URL once S3 is configured
  const uploadUrl = `/api/placeholder-upload/${key}`

  return { photo, uploadUrl }
}

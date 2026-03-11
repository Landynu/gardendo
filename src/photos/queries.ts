import { type GetPhotoUrl, type GetPlantPhotos } from "wasp/server/operations"
import { type Photo } from "wasp/entities"
import { HttpError } from "wasp/server"
import { getPresignedDownloadUrl } from "../lib/s3"

type GetPhotoUrlArgs = {
  id: string
}

type PhotoUrlResult = {
  url: string
}

export const getPhotoUrl: GetPhotoUrl<
  GetPhotoUrlArgs,
  PhotoUrlResult
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  const photo = await context.entities.Photo.findUnique({
    where: { id: args.id },
  })

  if (!photo) throw new HttpError(404, "Photo not found")

  const url = await getPresignedDownloadUrl(photo.key)
  return { url }
}

type GetPlantPhotosArgs = {
  plantId: string
}

type PhotoWithUrl = {
  id: string
  key: string
  caption: string | null
  takenAt: string | null
  url: string
  createdAt: Date
}

export const getPlantPhotos: GetPlantPhotos<
  GetPlantPhotosArgs,
  PhotoWithUrl[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  const photos = await context.entities.Photo.findMany({
    where: { plantId: args.plantId },
    orderBy: { createdAt: "desc" },
  })

  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      key: photo.key,
      caption: photo.caption,
      takenAt: photo.takenAt,
      url: await getPresignedDownloadUrl(photo.key),
      createdAt: photo.createdAt,
    }))
  )

  return photosWithUrls
}

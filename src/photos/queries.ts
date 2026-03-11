import { type GetPhotoUrl } from "wasp/server/operations"
import { HttpError } from "wasp/server"

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

  // TODO: Replace with S3 presigned URL generation
  return { url: photo.key }
}

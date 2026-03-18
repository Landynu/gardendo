import { type SaveWeatherConfig, type DeleteWeatherConfig } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { encrypt } from "../ai/crypto"

type SaveWeatherConfigArgs = {
  propertyId: string
  apiToken: string
  stationId: number
}

export const saveWeatherConfig: SaveWeatherConfig<SaveWeatherConfigArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const encryptedToken = encrypt(args.apiToken)

  return context.entities.Property.update({
    where: { id: args.propertyId },
    data: {
      weatherApiToken: encryptedToken,
      weatherStationId: args.stationId,
    },
  })
}

type DeleteWeatherConfigArgs = {
  propertyId: string
}

export const deleteWeatherConfig: DeleteWeatherConfig<DeleteWeatherConfigArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.Property.update({
    where: { id: args.propertyId },
    data: {
      weatherApiToken: null,
      weatherStationId: null,
    },
  })
}

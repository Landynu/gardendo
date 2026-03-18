import { type GetWeather } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetWeatherArgs = {
  propertyId: string
}

type WeatherCode = number

type CurrentWeather = {
  temperature: number
  weatherCode: WeatherCode
  humidity: number
  windSpeed: number
  description: string
}

type DayForecast = {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: WeatherCode
  precipitationProbability: number
  description: string
}

type WeatherResult = {
  current: CurrentWeather
  forecast: DayForecast[]
  frostWarning: boolean
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
}

function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown"
}

export const getWeather: GetWeather<GetWeatherArgs, WeatherResult | null> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const property = await context.entities.Property.findUnique({
    where: { id: args.propertyId },
  })
  if (!property) throw new HttpError(404, "Property not found")

  if (!property.latitude || !property.longitude) {
    return null
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${property.latitude}&longitude=${property.longitude}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=celsius&timezone=${encodeURIComponent(property.timezone)}&forecast_days=3`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const current: CurrentWeather = {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      description: describeWeather(data.current.weather_code),
    }

    const forecast: DayForecast[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: data.daily.weather_code[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      description: describeWeather(data.daily.weather_code[i]),
    }))

    const frostWarning = data.daily.temperature_2m_min.some(
      (min: number) => min <= 0
    )

    return { current, forecast, frostWarning }
  } catch {
    return null
  }
}

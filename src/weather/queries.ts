import {
  type GetWeather,
  type GetWeatherConfigStatus,
  type GetTempestStations,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { decrypt } from "../ai/crypto"

// ─── Types ──────────────────────────────────

type GetWeatherArgs = { propertyId: string }

type CurrentWeather = {
  temperature: number
  weatherCode: number
  humidity: number
  windSpeed: number
  description: string
}

type DayForecast = {
  date: string
  tempMax: number
  tempMin: number
  weatherCode: number
  precipitationProbability: number
  description: string
}

type TempestExtras = {
  feelsLike: number | null
  dewPoint: number | null
  uvIndex: number | null
  solarRadiation: number | null
  pressureMb: number | null
  precipAccumToday: number | null
}

type RegionalData = {
  temperature: number
  tempMax: number
  tempMin: number
  description: string
}

type Deltas = {
  temperatureDiff: number
  frostDisagree: boolean
  message: string | null
}

type WeatherResult = {
  source: "tempest" | "open-meteo"
  current: CurrentWeather
  forecast: DayForecast[]
  frostWarning: boolean
  tempestExtras: TempestExtras | null
  regional: RegionalData | null
  deltas: Deltas | null
}

// ─── Weather code descriptions ──────────────

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown"
}

// Map Tempest icon names to approximate WMO weather codes
const TEMPEST_ICON_TO_WMO: Record<string, number> = {
  "clear-day": 0, "clear-night": 0,
  "cloudy": 3, "foggy": 45,
  "partly-cloudy-day": 2, "partly-cloudy-night": 2,
  "possibly-rainy-day": 61, "possibly-rainy-night": 61,
  "rainy": 63, "sleet": 77, "snow": 73,
  "thunderstorm": 95, "windy": 3,
  "possibly-snow-day": 71, "possibly-snow-night": 71,
  "possibly-thunderstorm-day": 95, "possibly-thunderstorm-night": 95,
}

// ─── Open-Meteo fetcher ─────────────────────

async function fetchOpenMeteo(lat: number, lon: number, tz: string): Promise<{
  current: CurrentWeather
  forecast: DayForecast[]
  frostWarning: boolean
} | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=celsius&timezone=${encodeURIComponent(tz)}&forecast_days=3`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    return {
      current: {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        description: describeWeather(data.current.weather_code),
      },
      forecast: data.daily.time.map((date: string, i: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weather_code[i],
        precipitationProbability: data.daily.precipitation_probability_max[i],
        description: describeWeather(data.daily.weather_code[i]),
      })),
      frostWarning: data.daily.temperature_2m_min.some((min: number) => min <= 0),
    }
  } catch {
    return null
  }
}

// ─── Tempest fetcher ────────────────────────

async function fetchTempest(token: string, stationId: number): Promise<{
  current: CurrentWeather
  forecast: DayForecast[]
  frostWarning: boolean
  extras: TempestExtras
} | null> {
  const url = `https://swd.weatherflow.com/swd/rest/better_forecast?station_id=${stationId}&token=${token}&units_temp=c&units_wind=kph&units_pressure=mb&units_precip=mm`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()

    const cc = data.current_conditions
    if (!cc) return null

    const weatherCode = TEMPEST_ICON_TO_WMO[cc.icon] ?? 3

    const current: CurrentWeather = {
      temperature: Math.round(cc.air_temperature),
      weatherCode,
      humidity: Math.round(cc.relative_humidity ?? 0),
      windSpeed: Math.round(cc.wind_avg ?? 0),
      description: cc.conditions ?? describeWeather(weatherCode),
    }

    const daily = data.forecast?.daily ?? []
    const forecast: DayForecast[] = daily.slice(0, 3).map((day: any) => ({
      date: new Date(day.day_start_local * 1000).toISOString().split("T")[0],
      tempMax: Math.round(day.air_temp_high),
      tempMin: Math.round(day.air_temp_low),
      weatherCode: TEMPEST_ICON_TO_WMO[day.icon] ?? 3,
      precipitationProbability: day.precip_probability ?? 0,
      description: day.conditions ?? "",
    }))

    const frostWarning = daily.some((day: any) => day.air_temp_low <= 0)

    const extras: TempestExtras = {
      feelsLike: cc.feels_like != null ? Math.round(cc.feels_like) : null,
      dewPoint: cc.dew_point != null ? Math.round(cc.dew_point) : null,
      uvIndex: cc.uv ?? null,
      solarRadiation: cc.solar_radiation ?? null,
      pressureMb: cc.sea_level_pressure != null ? Math.round(cc.sea_level_pressure) : null,
      precipAccumToday: cc.precip_accum_local_day ?? null,
    }

    return { current, forecast, frostWarning, extras }
  } catch {
    return null
  }
}

// ─── Main weather query ─────────────────────

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

  if (!property.latitude || !property.longitude) return null

  // Always fetch Open-Meteo
  const openMeteoPromise = fetchOpenMeteo(property.latitude, property.longitude, property.timezone)

  // Fetch Tempest if configured
  let tempestResult: Awaited<ReturnType<typeof fetchTempest>> = null
  if (property.weatherApiToken && property.weatherStationId) {
    try {
      const token = decrypt(property.weatherApiToken)
      tempestResult = await fetchTempest(token, property.weatherStationId)
    } catch {
      // Decryption or fetch failed — fall through to Open-Meteo
    }
  }

  const openMeteo = await openMeteoPromise

  // Use Tempest as primary if available
  if (tempestResult) {
    const tempestFrost = tempestResult.frostWarning
    const openMeteoFrost = openMeteo?.frostWarning ?? false

    let regional: RegionalData | null = null
    let deltas: Deltas | null = null

    if (openMeteo) {
      regional = {
        temperature: openMeteo.current.temperature,
        tempMax: openMeteo.forecast[0]?.tempMax ?? 0,
        tempMin: openMeteo.forecast[0]?.tempMin ?? 0,
        description: openMeteo.current.description,
      }

      const tempDiff = tempestResult.current.temperature - openMeteo.current.temperature
      const frostDisagree = tempestFrost !== openMeteoFrost

      let message: string | null = null
      if (Math.abs(tempDiff) >= 2) {
        const direction = tempDiff > 0 ? "warmer" : "colder"
        message = `Your station is ${Math.abs(tempDiff)}°C ${direction} than regional forecast`
      }
      if (frostDisagree) {
        const who = tempestFrost ? "your station shows frost risk, regional does not" : "regional shows frost risk, your station does not"
        message = message ? `${message}. Frost disagreement: ${who}` : `Frost disagreement: ${who}`
      }

      deltas = { temperatureDiff: tempDiff, frostDisagree, message }
    }

    return {
      source: "tempest",
      current: tempestResult.current,
      forecast: tempestResult.forecast,
      frostWarning: tempestFrost || openMeteoFrost,
      tempestExtras: tempestResult.extras,
      regional,
      deltas,
    }
  }

  // Fall back to Open-Meteo
  if (!openMeteo) return null

  return {
    source: "open-meteo",
    current: openMeteo.current,
    forecast: openMeteo.forecast,
    frostWarning: openMeteo.frostWarning,
    tempestExtras: null,
    regional: null,
    deltas: null,
  }
}

// ─── Weather config status ──────────────────

type GetWeatherConfigStatusArgs = { propertyId: string }
type WeatherConfigStatus = { hasToken: boolean; stationId: number | null }

export const getWeatherConfigStatus: GetWeatherConfigStatus<
  GetWeatherConfigStatusArgs,
  WeatherConfigStatus
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const property = await context.entities.Property.findUnique({
    where: { id: args.propertyId },
    select: { weatherApiToken: true, weatherStationId: true },
  })

  return {
    hasToken: !!property?.weatherApiToken,
    stationId: property?.weatherStationId ?? null,
  }
}

// ─── Tempest station discovery ──────────────

type GetTempestStationsArgs = { propertyId: string }
type TempestStation = { id: number; name: string; latitude: number; longitude: number }

export const getTempestStations: GetTempestStations<
  GetTempestStationsArgs,
  TempestStation[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const property = await context.entities.Property.findUnique({
    where: { id: args.propertyId },
  })
  if (!property?.weatherApiToken) throw new HttpError(400, "No weather API token configured")

  let token: string
  try {
    token = decrypt(property.weatherApiToken)
  } catch {
    throw new HttpError(400, "Failed to decrypt weather API token")
  }

  const res = await fetch(`https://swd.weatherflow.com/swd/rest/stations?token=${token}`)
  if (!res.ok) {
    throw new HttpError(502, "Failed to fetch stations from Tempest API")
  }

  const data = await res.json()
  const stations = data.stations ?? []

  return stations.map((s: any) => ({
    id: s.station_id,
    name: s.name ?? s.public_name ?? `Station ${s.station_id}`,
    latitude: s.latitude ?? 0,
    longitude: s.longitude ?? 0,
  }))
}

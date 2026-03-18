import { useQuery, getWeather } from "wasp/client/operations"
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Wind,
  Droplets,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"

function weatherIcon(code: number): LucideIcon {
  if (code <= 1) return Sun
  if (code <= 3) return Cloud
  if (code <= 48) return Cloud
  if (code <= 55) return CloudDrizzle
  if (code <= 65) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  return CloudLightning
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return DAY_NAMES[d.getDay()]
}

export function WeatherWidget({ propertyId }: { propertyId: string }) {
  const { data: weather } = useQuery(getWeather, { propertyId })

  if (!weather) return null

  const CurrentIcon = weatherIcon(weather.current.weatherCode)

  return (
    <div className="card p-4">
      {weather.frostWarning && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Frost warning — overnight low at or below 0°C expected
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Current conditions */}
        <div className="flex items-center gap-3">
          <CurrentIcon className="h-10 w-10 text-primary-500" />
          <div>
            <p className="text-2xl font-bold text-neutral-900">
              {weather.current.temperature}°C
            </p>
            <p className="text-sm text-neutral-500">{weather.current.description}</p>
          </div>
        </div>

        {/* Current details */}
        <div className="hidden items-center gap-4 text-sm text-neutral-500 sm:flex">
          <span className="flex items-center gap-1">
            <Droplets className="h-4 w-4" />
            {weather.current.humidity}%
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-4 w-4" />
            {weather.current.windSpeed} km/h
          </span>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-3">
        {weather.forecast.map((day) => {
          const DayIcon = weatherIcon(day.weatherCode)
          return (
            <div key={day.date} className="text-center">
              <p className="text-xs font-medium text-neutral-500">{formatDay(day.date)}</p>
              <DayIcon className="mx-auto my-1 h-5 w-5 text-neutral-400" />
              <p className="text-sm">
                <span className="font-medium text-neutral-800">{day.tempMax}°</span>
                <span className="text-neutral-400"> / {day.tempMin}°</span>
              </p>
              {day.precipitationProbability > 20 && (
                <p className="text-xs text-blue-500">{day.precipitationProbability}%</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

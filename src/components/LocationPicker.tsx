import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon (Leaflet + bundlers issue)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type LocationPickerProps = {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}

function DraggableMarker({
  position,
  onChange,
}: {
  position: [number, number]
  onChange: (lat: number, lng: number) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current
          if (marker) {
            const { lat, lng } = marker.getLatLng()
            onChange(lat, lng)
          }
        },
      }}
    />
  )
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!mapReady) return null

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "280px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker
          position={[latitude, longitude]}
          onChange={onChange}
        />
      </MapContainer>
      <div className="bg-neutral-50 px-3 py-1.5 text-xs text-neutral-500">
        Click or drag marker to set location &middot;{" "}
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </div>
    </div>
  )
}

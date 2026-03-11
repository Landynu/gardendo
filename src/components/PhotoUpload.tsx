import { useState, useRef } from "react"
import { getUploadUrl } from "wasp/client/operations"
import { Camera, Upload, X, Loader2 } from "lucide-react"

type Props = {
  propertyId: string
  zoneId?: string
  bedId?: string
  taskId?: string
  plantId?: string
  onUploaded?: (photo: { id: string; key: string }) => void
}

export function PhotoUpload({
  propertyId,
  zoneId,
  bedId,
  taskId,
  plantId,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setError("")
    setUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const { photo, uploadUrl } = await getUploadUrl({
        propertyId,
        contentType: file.type,
        zoneId,
        bedId,
        taskId,
        plantId,
      })

      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!res.ok) throw new Error("Upload failed")

      onUploaded?.({ id: photo.id, key: photo.key })
      setPreview(null)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            {preview && (
              <img
                src={preview}
                alt="Uploading"
                className="mb-2 h-20 w-20 rounded-lg object-cover opacity-60"
              />
            )}
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <p className="text-sm text-neutral-500">Uploading...</p>
          </div>
        ) : (
          <>
            <Camera className="mb-2 h-8 w-8 text-neutral-400" />
            <p className="text-sm text-neutral-600">
              Drag & drop a photo or{" "}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              JPG, PNG, WebP up to 10MB
            </p>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}

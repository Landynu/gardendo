# Styling Guide

## Tailwind CSS v4

GardenDo uses Tailwind CSS v4 with the Vite plugin (`@tailwindcss/vite`). No `tailwind.config.js` — all theme configuration is in `src/App.css`.

## Theme Configuration

### `@theme` Block (src/App.css)
```css
@theme {
  --color-primary-50: ...;   /* Green palette (50-950) */
  --color-accent-50: ...;    /* Gold/yellow palette */
  --color-earth-50: ...;     /* Brown palette */
}
```

### Color Palette
| Name | Hue | Usage |
|---|---|---|
| `primary-*` | Green | Primary actions, navigation, CTAs |
| `accent-*` | Gold/Yellow | Highlights, warnings, accents |
| `earth-*` | Brown | Soil/nature themed accents |
| `neutral-*` | Gray | Standard grays (Tailwind built-in) |

## Custom Utilities

Defined via `@utility` in `src/App.css`:

| Utility | Purpose |
|---|---|
| `card` | Rounded-xl border with shadow |
| `page-container` | Max-w-7xl centered with padding |
| `page-title` | Text-2xl bold tracking-tight |
| `btn-primary` | Green filled button with hover/focus |
| `btn-secondary` | White outlined button |
| `label` | Text-sm font-medium |

## Page Component Pattern

```tsx
export function MyPage() {
  return (
    <div className="page-container">
      <h1 className="page-title">Page Title</h1>

      <div className="card">
        {/* Card content */}
      </div>

      <button className="btn-primary">Save</button>
      <button className="btn-secondary">Cancel</button>
    </div>
  )
}
```

## Icons
Use `lucide-react` for all icons:
```tsx
import { Plus, Trash2, Edit } from 'lucide-react'
```

## Garden Bed Grid
```tsx
<div
  className="grid gap-1"
  style={{ gridTemplateColumns: `repeat(${bed.widthFt}, 1fr)` }}
>
  {squares.map(sq => (
    <div
      key={sq.id}
      style={{ backgroundColor: sq.plant?.sqftColor }}
    />
  ))}
</div>
```

## No Component Library
GardenDo does not use ShadCN or any component library. All components are hand-rolled with Tailwind utilities.

# SpringAIS Styling Guide

**Last Updated:** 2026-01-06
**CSS Framework:** Tailwind CSS 3.3
**Component Library:** shadcn/ui

---

## Color Palette (EY Branding)

```css
/* Primary Colors */
--color-primary: #FFE600;      /* EY Yellow */
--color-primary-dark: #E6CF00; /* Hover state */

/* Neutral Colors */
--color-dark: #2E2E38;         /* Header, dark text */
--color-gray-900: #1A1A1A;
--color-gray-700: #4A4A4A;
--color-gray-500: #9CA3AF;
--color-gray-300: #D1D5DB;
--color-gray-100: #F3F4F6;
--color-white: #FFFFFF;

/* Semantic Colors */
--color-success: #10B981;      /* Green */
--color-error: #EF4444;        /* Red */
--color-warning: #F59E0B;      /* Orange */
--color-info: #3B82F6;         /* Blue */
```

**Tailwind Config:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFE600',
          dark: '#E6CF00',
        },
      },
    },
  },
};
```

---

## Typography

### Headings

```tsx
<h1 className="text-4xl font-bold text-gray-900">Page Title</h1>
<h2 className="text-3xl font-semibold text-gray-900">Section Title</h2>
<h3 className="text-2xl font-medium text-gray-900">Subsection</h3>
<h4 className="text-xl font-medium text-gray-700">Card Title</h4>
```

### Body Text

```tsx
<p className="text-base text-gray-700">Regular paragraph text</p>
<p className="text-sm text-gray-600">Secondary text, descriptions</p>
<p className="text-xs text-gray-500">Captions, timestamps</p>
```

---

## Spacing System

Use Tailwind's spacing scale (4px increments):

```tsx
<div className="p-4">       {/* 16px padding */}
<div className="p-6">       {/* 24px padding */}
<div className="p-8">       {/* 32px padding */}

<div className="space-y-4"> {/* 16px vertical gap between children */}
<div className="gap-6">     {/* 24px gap in flexbox/grid */}
```

---

## Layout Patterns

### Card Layout

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <MatchCard />
  <MatchCard />
  <MatchCard />
</div>
```

### Flexbox Layout

```tsx
<div className="flex items-center justify-between">
  <span>Label</span>
  <Button>Action</Button>
</div>
```

---

## Component Styling

### Buttons

```tsx
// Primary button (EY Yellow)
<Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
  Apply Now
</Button>

// Secondary button
<Button variant="outline">
  Save Match
</Button>

// Danger button
<Button variant="destructive">
  Delete
</Button>
```

### Input Fields

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Search skills..."
  className="max-w-sm"
/>
```

### Badges/Tags

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Expert
</span>
```

---

## Responsive Design

```tsx
// Mobile-first approach
<div className="
  w-full           /* Full width on mobile */
  md:w-1/2         /* 50% width on tablet */
  lg:w-1/3         /* 33% width on desktop */
  p-4              /* 16px padding all sizes */
  md:p-6           /* 24px padding on tablet+ */
">
  Content
</div>
```

---

## Dark Mode (Future Enhancement)

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content adapts to theme
</div>
```

---

## shadcn/ui Components

Install components as needed:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
```

**Available Components:**
- Button, Card, Input, Select, Checkbox, Radio
- Dialog, Dropdown, Popover, Tooltip
- Table, Tabs, Accordion
- Progress, Spinner, Badge

---

## Custom Utilities

```tsx
// frontend/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage: Merge Tailwind classes safely
<div className={cn(
  "px-4 py-2",
  isActive && "bg-yellow-400",
  className // Props className
)}>
```

---

## Related Documentation

- `reference-docs/frontend/component-library.md` - Component examples

**Implemented In:** All frontend blocks (H, I, J, K, L)

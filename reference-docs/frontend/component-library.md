# SpringAIS Component Library

**Last Updated:** 2026-01-06
**Framework:** React 18 + TypeScript
**UI Library:** shadcn/ui + Tailwind CSS

---

## Overview

SpringAIS frontend uses a component-based architecture with reusable components following these principles:

1. **Composition over inheritance** - Build complex UIs from small, focused components
2. **Props for configuration** - Use props to customize behavior, not hardcoded values
3. **TypeScript for safety** - All components are fully typed
4. **Accessible by default** - Use semantic HTML and ARIA attributes
5. **shadcn/ui foundation** - Build on top of shadcn/ui primitives

---

## Component Categories

### Layout Components
- **MainLayout** - Overall app structure (header + sidebar + content)
- **Header** - Top navigation bar
- **Sidebar** - Left navigation menu
- **ContentArea** - Main content wrapper

### Auth Components
- **LoginPage** - Login form
- **ProtectedRoute** - Route wrapper for authenticated pages
- **LogoutButton** - Logout action button

### Skill Components
- **SkillCard** - Display single skill with proficiency
- **SkillBadge** - Small skill tag
- **SkillList** - List of skills with filters
- **SkillTree** - Hierarchical skill visualization
- **ResumeUpload** - Drag-and-drop resume upload

### Match Components
- **MatchCard** - Job match result card
- **MatchList** - List of matches with sorting/filtering
- **SkillGapDisplay** - Visual skill gap analysis
- **MatchFilters** - Department, location, score filters

### Career Viz Components
- **CareerGraph** - React Flow career path visualization
- **CareerNode** - Custom node for career graph
- **CareerEdge** - Custom edge with transition metrics
- **GraphControls** - Zoom, pan, layout controls

### Success Pattern Components
- **SuccessMetricsCard** - Success rate, avg time display
- **SuccessRateChart** - Bar chart (Recharts)
- **SkillFrequencyChart** - Skill frequency visualization
- **TimelineChart** - Promotion timeline chart

### Common Components
- **Button** - shadcn/ui Button wrapper
- **Card** - shadcn/ui Card wrapper
- **Input** - shadcn/ui Input wrapper
- **Select** - shadcn/ui Select wrapper
- **LoadingSpinner** - Loading indicator
- **ErrorMessage** - Error display component

---

## Layout Components

### MainLayout

**Purpose:** Overall app structure with header, sidebar, and content area

**File:** `frontend/src/components/layout/MainLayout.tsx`

```tsx
// frontend/src/components/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />  {/* Nested routes render here */}
        </main>
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
// App.tsx
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<SkillsDashboard />} />
  <Route path="/matches" element={<MatchResults />} />
</Route>
```

**Implemented In:** Block H (Auth & Layout)

---

### Header

**Purpose:** Top navigation bar with logo, user info, logout

**File:** `frontend/src/components/layout/Header.tsx`

```tsx
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '../auth/LogoutButton';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 border-b border-gray-700">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">SpringAIS</span>
        <span className="text-yellow-400 text-sm">by EY</span>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
```

**Implemented In:** Block H (Auth & Layout)

---

### Sidebar

**Purpose:** Left navigation menu with links to all sections

**File:** `frontend/src/components/layout/Sidebar.tsx`

```tsx
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  TrendingUp
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Skills Dashboard', icon: LayoutDashboard },
  { path: '/matches', label: 'Match Results', icon: Sparkles },
  { path: '/career-path', label: 'Career Path', icon: GitBranch },
  { path: '/success-patterns', label: 'Success Patterns', icon: TrendingUp },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <nav className="flex flex-col h-full py-6">
      <ul className="space-y-2 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-yellow-400 text-gray-900 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

**Implemented In:** Block H (Auth & Layout)

---

## Skill Components

### SkillCard

**Purpose:** Display single skill with proficiency badge

**File:** `frontend/src/components/skills/SkillCard.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SkillBadge from './SkillBadge';

interface SkillCardProps {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsExperience?: number;
  source?: 'resume' | 'manual';
  onRemove?: () => void;
}

export default function SkillCard({
  name,
  proficiency,
  yearsExperience,
  source,
  onRemove
}: SkillCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>
              {yearsExperience && `${yearsExperience} years experience`}
            </CardDescription>
          </div>

          <SkillBadge proficiency={proficiency} />
        </div>

        {source === 'resume' && (
          <p className="text-xs text-gray-500 mt-2">Extracted from resume</p>
        )}

        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 text-sm mt-2 hover:underline"
          >
            Remove
          </button>
        )}
      </CardHeader>
    </Card>
  );
}
```

**Usage:**
```tsx
<SkillCard
  name="Python"
  proficiency="Expert"
  yearsExperience={5}
  source="resume"
  onRemove={() => handleRemoveSkill('Python')}
/>
```

**Implemented In:** Block I (Skills Dashboard)

---

### SkillBadge

**Purpose:** Small colored badge showing proficiency level

**File:** `frontend/src/components/skills/SkillBadge.tsx`

```tsx
import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  className?: string;
}

const proficiencyColors = {
  Beginner: 'bg-gray-100 text-gray-800 border-gray-300',
  Intermediate: 'bg-blue-100 text-blue-800 border-blue-300',
  Advanced: 'bg-purple-100 text-purple-800 border-purple-300',
  Expert: 'bg-green-100 text-green-800 border-green-300',
};

export default function SkillBadge({ proficiency, className }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        proficiencyColors[proficiency],
        className
      )}
    >
      {proficiency}
    </span>
  );
}
```

**Implemented In:** Block I (Skills Dashboard)

---

### ResumeUpload

**Purpose:** Drag-and-drop resume upload with progress

**File:** `frontend/src/components/skills/ResumeUpload.tsx`

```tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ResumeUploadProps {
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
}

export default function ResumeUpload({ onUpload, maxSizeMB = 10 }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    // Simulate progress (real implementation would use upload progress event)
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await onUpload(file);
      setProgress(100);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-yellow-400 bg-yellow-50"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop your resume here"
              : "Drag & drop your resume, or click to browse"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            PDF or DOCX, max {maxSizeMB} MB
          </p>
        </div>
      )}

      {/* File preview */}
      {file && !uploading && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <button
            onClick={() => setFile(null)}
            className="text-gray-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Extract Skills from Resume
        </Button>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-gray-500">
            Processing resume with AI (~15 seconds)
          </p>
        </div>
      )}
    </div>
  );
}
```

**Usage:**
```tsx
<ResumeUpload
  onUpload={async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/skill-extraction', formData);
  }}
  maxSizeMB={10}
/>
```

**Implemented In:** Block I (Skills Dashboard), Block N (Skills Integration)

---

## Match Components

### MatchCard

**Purpose:** Display single job match with score and skills

**File:** `frontend/src/components/matches/MatchCard.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Send, X } from 'lucide-react';
import SkillGapDisplay from './SkillGapDisplay';

interface MatchCardProps {
  jobId: number;
  title: string;
  department: string;
  location: string;
  compositeScore: number;
  overlappingSkills: string[];
  missingSkills: string[];
  onSave?: () => void;
  onApply?: () => void;
  onDismiss?: () => void;
}

export default function MatchCard({
  jobId,
  title,
  department,
  location,
  compositeScore,
  overlappingSkills,
  missingSkills,
  onSave,
  onApply,
  onDismiss
}: MatchCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>
              {department} • {location}
            </CardDescription>
          </div>

          {/* Match score */}
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-green-600">
              {Math.round(compositeScore * 100)}%
            </span>
            <span className="text-sm text-gray-500">match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Skill gap analysis */}
        <SkillGapDisplay
          overlapping={overlappingSkills}
          missing={missingSkills}
        />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </Button>
          )}

          {onApply && (
            <Button size="sm" onClick={onApply} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
              <Send className="w-4 h-4 mr-2" />
              Apply
            </Button>
          )}

          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="w-4 h-4 mr-2" />
              Not Interested
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Implemented In:** Block J (Match Results), Block O (Matching Integration)

---

### SkillGapDisplay

**Purpose:** Visual skill gap analysis with color coding

**File:** `frontend/src/components/matches/SkillGapDisplay.tsx`

```tsx
import { Check, X, ArrowRight } from 'lucide-react';

interface SkillGapDisplayProps {
  overlapping: string[];
  missing: string[];
  transferable?: string[];
}

export default function SkillGapDisplay({
  overlapping,
  missing,
  transferable = []
}: SkillGapDisplayProps) {
  return (
    <div className="space-y-3">
      {/* Overlapping skills */}
      {overlapping.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            ✓ You have these skills ({overlapping.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {overlapping.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs"
              >
                <Check className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missing.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            ✗ Skills to develop ({missing.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs"
              >
                <X className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Transferable skills */}
      {transferable.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            ↔ Transferable skills ({transferable.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {transferable.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs"
              >
                <ArrowRight className="w-3 h-3" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Implemented In:** Block J (Match Results), Block O (Matching Integration)

---

## Common Components

### LoadingSpinner

**Purpose:** Reusable loading indicator

**File:** `frontend/src/components/common/LoadingSpinner.tsx`

```tsx
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function LoadingSpinner({
  size = 'md',
  message,
  className
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-yellow-400", sizeClasses[size])} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
```

**Usage:**
```tsx
{loading && <LoadingSpinner size="lg" message="Loading matches..." />}
```

---

### ErrorMessage

**Purpose:** Display error messages with retry option

**File:** `frontend/src/components/common/ErrorMessage.tsx`

```tsx
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <p className="text-gray-700">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Usage:**
```tsx
{error && (
  <ErrorMessage
    message="Failed to load matches. Please try again."
    onRetry={refetch}
  />
)}
```

---

## TypeScript Patterns

### Component Props

```tsx
// Define props interface
interface MyComponentProps {
  // Required props
  title: string;
  count: number;

  // Optional props
  description?: string;
  onAction?: () => void;

  // Union types
  variant?: 'primary' | 'secondary' | 'danger';

  // Children
  children?: React.ReactNode;

  // HTML attributes
  className?: string;
}

export default function MyComponent({
  title,
  count,
  description,
  onAction,
  variant = 'primary',
  children,
  className
}: MyComponentProps) {
  // Component implementation
}
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

export default function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage:
<List
  items={skills}
  renderItem={(skill) => <SkillCard {...skill} />}
  keyExtractor={(skill) => skill.name}
/>
```

---

## Related Documentation

**Frontend:**
- `reference-docs/frontend/state-management.md` - React Query, Context API
- `reference-docs/frontend/routing-structure.md` - React Router patterns
- `reference-docs/frontend/styling-guide.md` - Tailwind CSS + shadcn/ui

**Backend:**
- `reference-docs/backend/api-reference.md` - API endpoints for data fetching

**Implementation:**
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-I-SKILLS-DASHBOARD/` - Skills UI
- `implementation-tracking/STEP-2-DEVELOPMENT/BLOCK-J-MATCH-RESULTS/` - Match UI

---

**Document Purpose:** Reusable component reference for frontend developers
**Audience:** Frontend developers building new features
**Last Updated:** 2026-01-06

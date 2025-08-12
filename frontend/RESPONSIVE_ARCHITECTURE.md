# Responsive Architecture Documentation

## Overview
The application uses a multi-layered responsive design system that adapts to different screen sizes and device types.

## Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Core Components

### 1. useNavigation Hook
**Location**: `app/components/navigation/hook/use-navigation.ts`
- Manages device detection and responsive state
- Provides `isMobile`, `isTablet`, `isDesktop` booleans
- Handles sidebar state and animations
- Optimized performance with proper cleanup

### 2. ResponsiveMain Component
**Location**: `app/components/ResponsiveMain.tsx`
- Main layout wrapper for all pages
- Dynamic margin calculation based on sidebar state
- Responsive padding and spacing
- Smooth transitions between device types

### 3. NavigationBar Component
**Location**: `app/components/navigation/navigation.tsx`
- Adaptive sidebar behavior:
  - Mobile: Overlay sidebar with backdrop
  - Tablet/Desktop: Fixed sidebar with push layout
- Responsive modals and notifications
- Touch-friendly interactions on mobile

## Responsive Features

### Master Inventory Page
**Location**: `app/Features/Inventory/Master_Inventory/page.tsx`
- **Mobile**: Card-based layout with vertical stacking
- **Tablet**: Hybrid table with horizontal scroll
- **Desktop**: Full table with all columns visible
- Responsive modals and form layouts
- Adaptive filter sections

### Dashboard
**Location**: `app/Features/Dashboard/page.tsx`
- Grid system adapts to screen size
- Charts resize dynamively
- PWA status indicators adjust position
- Mobile-friendly touch interactions

## Implementation Guidelines

### 1. Using Device Detection
```tsx
const { isMobile, isTablet, isDesktop } = useNavigation();

// Conditional rendering
{isMobile ? <MobileComponent /> : <DesktopComponent />}

// Conditional classes
className={`base-styles ${isMobile ? 'mobile-styles' : 'desktop-styles'}`}
```

### 2. Responsive Layout Structure
```tsx
<ResponsiveMain>
  <div className="responsive-container">
    {/* Your page content */}
  </div>
</ResponsiveMain>
```

### 3. Modal Responsiveness
```tsx
<div className={`modal-container ${isMobile ? "mobile-modal" : "desktop-modal"}`}>
  <section className={`modal-content ${isMobile ? "w-full max-w-sm" : "max-w-md"}`}>
    {/* Modal content */}
  </section>
</div>
```

## Tailwind CSS Responsive Classes

### Container Sizing
- `w-full`: Full width on mobile
- `sm:w-auto`: Auto width on small screens and up
- `lg:w-1/2`: Half width on large screens

### Grid Systems
- `grid-cols-1`: Single column on mobile
- `md:grid-cols-2`: Two columns on medium screens
- `lg:grid-cols-3`: Three columns on large screens

### Spacing
- `p-4`: Padding on mobile
- `sm:p-6`: Increased padding on small screens
- `lg:p-8`: Larger padding on large screens

## Performance Optimizations

### 1. Efficient Re-renders
- useCallback for event handlers
- useMemo for expensive calculations
- Proper dependency arrays in useEffect

### 2. Smooth Animations
- CSS transitions for sidebar states
- Reduced motion support for accessibility
- Hardware-accelerated transforms

### 3. Touch Interactions
- Larger touch targets on mobile (min 44px)
- Gesture-friendly swipe areas
- Haptic feedback considerations

## Testing Checklist

### Mobile (< 768px)
- [ ] Sidebar overlays content properly
- [ ] Modals fit screen width
- [ ] Touch targets are appropriately sized
- [ ] Tables convert to card layout
- [ ] Forms stack vertically

### Tablet (768px - 1024px)
- [ ] Sidebar behaves correctly
- [ ] Tables show with horizontal scroll
- [ ] Modals are appropriately sized
- [ ] Grid layouts adjust properly

### Desktop (> 1024px)
- [ ] Fixed sidebar with push layout
- [ ] Full table visibility
- [ ] Modals center properly
- [ ] All features accessible
- [ ] Hover states work correctly

## Common Patterns

### Conditional Rendering
```tsx
{isMobile ? (
  <MobileCardView items={items} />
) : (
  <DesktopTableView items={items} />
)}
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

### Adaptive Spacing
```tsx
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-xl sm:text-2xl lg:text-3xl">Title</h1>
</div>
```

## Future Enhancements

1. **Progressive Web App Integration**
   - Offline-first responsive layouts
   - Cached responsive images
   - Touch gesture optimizations

2. **Advanced Animations**
   - Page transition animations
   - Micro-interactions for mobile
   - Parallax effects for desktop

3. **Accessibility Improvements**
   - Screen reader optimizations
   - Keyboard navigation enhancements
   - High contrast mode support

## Maintenance Notes

- Regularly test on actual devices, not just browser dev tools
- Monitor performance on lower-end mobile devices
- Keep accessibility in mind for all responsive changes
- Update breakpoints if needed based on user analytics

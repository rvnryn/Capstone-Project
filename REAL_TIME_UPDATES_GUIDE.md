# REAL-TIME DATA UPDATES - Implementation Guide

## Problem Fixed: Data Not Updating Automatically

**Before**: Had to manually refresh page/table to see new data
**After**: Data updates automatically after any create/update/delete operation

---

## 🎯 What Was Created

### 1. React Query Provider (`app/providers/ReactQueryProvider.tsx`)
- Manages global cache for all API data
- Auto-refreshes stale data
- Prevents duplicate requests

### 2. Custom API Hooks (`app/hooks/useApi.ts`)
- Pre-built hooks for all modules:
  - `useMenu()`, `useCreateMenu()`, `useUpdateMenu()`, `useDeleteMenu()`
  - `useInventory()`, `useCreateInventory()`, `useUpdateInventory()`, `useDeleteInventory()`
  - `useSalesReport()`, `useImportSales()`
  - `useDashboardStats()` (auto-refreshes every minute!)
  - `useSuppliers()`, `useCreateSupplier()`, etc.

### 3. Debounce Hook (`app/hooks/useDebounce.ts`)
- Delays search queries until user stops typing
- Prevents excessive API calls

### 4. Loading Skeletons (`app/components/ui/skeleton.tsx`)
- Beautiful loading placeholders
- Multiple variants: Table, Card Grid, List, Chart, Form

---

## 🚀 How To Use (Step-by-Step)

### Step 1: Replace Fetch with Custom Hooks

#### Example: Menu List Page

**BEFORE** (Old Way):
```typescript
// Old code - manual fetch, no auto-refresh
const [menuItems, setMenuItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch(`${API_URL}/api/menu`)
    .then(res => res.json())
    .then(data => {
      setMenuItems(data);
      setLoading(false);
    });
}, []);

return (
  <div>
    {loading ? "Loading..." : menuItems.map(item => <MenuItem {...item} />)}
  </div>
);
```

**AFTER** (New Way - Real-time!):
```typescript
import { useMenu, useDeleteMenu } from '@/app/hooks/useApi';
import { TableSkeleton } from '@/app/components/ui/skeleton';

function MenuPage() {
  // Automatically fetches, caches, and refreshes
  const { data: menuItems, isLoading } = useMenu();

  // Automatically invalidates cache after delete
  const deleteMutation = useDeleteMenu();

  const handleDelete = (menuId: number) => {
    deleteMutation.mutate(menuId);
    // Data will auto-refresh after mutation succeeds!
  };

  return (
    <div>
      {isLoading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : (
        menuItems?.map(item => (
          <MenuItem key={item.id} {...item} onDelete={handleDelete} />
        ))
      )}
    </div>
  );
}
```

---

### Step 2: Use Mutations for Create/Update/Delete

#### Example: Create Menu Item

**BEFORE**:
```typescript
const handleSubmit = async (formData) => {
  setLoading(true);
  try {
    await fetch(`${API_URL}/api/menu`, {
      method: 'POST',
      body: formData
    });
    toast.success('Created!');
    // Had to manually refresh or redirect
    router.refresh();
  } catch (error) {
    toast.error('Failed');
  } finally {
    setLoading(false);
  }
};
```

**AFTER**:
```typescript
import { useCreateMenu } from '@/app/hooks/useApi';

function CreateMenuForm() {
  const createMutation = useCreateMenu();

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
    // That's it! Auto-refreshes menu list and shows toast
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create Menu'}
      </button>
    </form>
  );
}
```

---

### Step 3: Add Debounced Search

#### Example: Inventory Search

**BEFORE**:
```typescript
const [search, setSearch] = useState('');

useEffect(() => {
  // This fires on EVERY keystroke! 😱
  fetchInventory(search);
}, [search]);

return <input value={search} onChange={e => setSearch(e.target.value)} />;
```

**AFTER**:
```typescript
import { useDebounce } from '@/app/hooks/useDebounce';
import { useInventory } from '@/app/hooks/useApi';

function InventorySearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // This only runs 300ms after user stops typing!
  const { data, isLoading } = useInventory({
    search: debouncedSearch
  });

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search inventory..."
      />
      {isLoading ? <Skeleton className="h-32" /> : <Results data={data} />}
    </div>
  );
}
```

---

### Step 4: Add Loading Skeletons

**BEFORE**:
```typescript
{loading ? <div>Loading...</div> : <Content />}
```

**AFTER**:
```typescript
import { TableSkeleton, CardGridSkeleton, ListSkeleton } from '@/app/components/ui/skeleton';

// For tables
{isLoading ? <TableSkeleton rows={10} columns={5} /> : <Table data={data} />}

// For card grids
{isLoading ? <CardGridSkeleton count={9} /> : <CardGrid items={items} />}

// For lists
{isLoading ? <ListSkeleton count={8} /> : <List items={items} />}
```

---

## 📦 Complete Examples for Each Module

### 1. MENU MODULE

```typescript
// pages/Features/Menu/page.tsx
import { useMenu, useDeleteMenu } from '@/app/hooks/useApi';
import { CardGridSkeleton } from '@/app/components/ui/skeleton';

export default function MenuPage() {
  const { data: menuItems, isLoading, error } = useMenu();
  const deleteMutation = useDeleteMenu();

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Menu Items</h1>
      {isLoading ? (
        <CardGridSkeleton count={9} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {menuItems?.map(item => (
            <MenuCard
              key={item.id}
              {...item}
              onDelete={() => deleteMutation.mutate(item.id)}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. INVENTORY MODULE

```typescript
// pages/Features/Inventory/page.tsx
import { useInventory, useUpdateInventory } from '@/app/hooks/useApi';
import { useDebounce } from '@/app/hooks/useDebounce';
import { TableSkeleton } from '@/app/components/ui/skeleton';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useInventory({
    search: debouncedSearch,
    category
  });

  const updateMutation = useUpdateInventory(selectedId);

  return (
    <div>
      <input
        placeholder="Search items..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        <option value="Meat">Meat</option>
        <option value="Vegetables">Vegetables</option>
      </select>

      {isLoading ? (
        <TableSkeleton rows={15} columns={6} />
      ) : (
        <InventoryTable data={data} onUpdate={updateMutation.mutate} />
      )}
    </div>
  );
}
```

### 3. SALES REPORT MODULE

```typescript
// pages/Features/Report/Report_Sales/page.tsx
import { useSalesReport, useImportSales } from '@/app/hooks/useApi';
import { ChartSkeleton } from '@/app/components/ui/skeleton';

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-01-31'
  });

  const { data, isLoading } = useSalesReport(dateRange);
  const importMutation = useImportSales();

  const handleImport = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
    // Sales report AND inventory will auto-refresh!
  };

  return (
    <div>
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {isLoading ? (
        <ChartSkeleton />
      ) : (
        <SalesChart data={data} />
      )}

      <button
        onClick={() => document.getElementById('file-input').click()}
        disabled={importMutation.isPending}
      >
        {importMutation.isPending ? 'Importing...' : 'Import Sales'}
      </button>
    </div>
  );
}
```

### 4. DASHBOARD MODULE

```typescript
// pages/Features/Dashboard/page.tsx
import { useDashboardStats } from '@/app/hooks/useApi';
import { Skeleton } from '@/app/components/ui/skeleton';

export default function DashboardPage() {
  // Auto-refreshes every 60 seconds!
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-4 gap-4">
      {isLoading ? (
        <>
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </>
      ) : (
        <>
          <StatCard title="Total Sales" value={data.totalSales} />
          <StatCard title="Low Stock" value={data.lowStockCount} />
          <StatCard title="Expiring Soon" value={data.expiringItems} />
          <StatCard title="Active Users" value={data.activeUsers} />
        </>
      )}
    </div>
  );
}
```

---

## 🎨 Loading Skeleton Variants

```typescript
// Table skeleton
<TableSkeleton rows={10} columns={5} />

// Card grid skeleton
<CardGridSkeleton count={9} />

// List skeleton
<ListSkeleton count={8} />

// Chart skeleton
<ChartSkeleton />

// Form skeleton
<FormSkeleton fields={6} />

// Custom skeleton
<Skeleton className="h-32 w-full rounded-lg" />
```

---

## 🔥 Advanced Features

### 1. Optimistic Updates

```typescript
const updateMutation = useUpdateInventory(itemId);

const handleUpdate = (newData) => {
  // UI updates immediately, rolls back if fails
  updateMutation.mutate(newData, {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['inventory']);

      // Snapshot previous value
      const previous = queryClient.getQueryData(['inventory']);

      // Optimistically update
      queryClient.setQueryData(['inventory'], old =>
        old.map(item => item.id === newData.id ? newData : item)
      );

      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['inventory'], context.previous);
    },
  });
};
```

### 2. Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['inventory'],
  queryFn: ({ pageParam = 0 }) =>
    fetchInventory({ offset: pageParam }),
  getNextPageParam: (lastPage, pages) =>
    lastPage.length === 50 ? pages.length * 50 : undefined,
});

// Load more button
<button onClick={() => fetchNextPage()} disabled={!hasNextPage}>
  {isFetchingNextPage ? 'Loading...' : 'Load More'}
</button>
```

### 3. Manual Refetch

```typescript
const { data, refetch } = useInventory();

// Force refetch
<button onClick={() => refetch()}>Refresh</button>
```

---

## ✅ Migration Checklist

For each page, replace:

- [ ] `useState` + `useEffect` + `fetch` → `useQuery` hook
- [ ] Manual submit handlers → `useMutation` hook
- [ ] "Loading..." text → `<Skeleton>` component
- [ ] Direct search → `useDebounce` hook
- [ ] Manual `router.refresh()` → Automatic cache invalidation

---

## 🐛 Troubleshooting

### Problem: Data not updating after mutation
**Solution**: Check that mutation calls `queryClient.invalidateQueries` (already built into custom hooks)

### Problem: Too many requests
**Solution**: Use `useDebounce` for search fields

### Problem: Stale data showing
**Solution**: Adjust `staleTime` in query options (lower = more frequent updates)

### Problem: Loading skeleton not showing
**Solution**: Import from `@/app/components/ui/skeleton`

---

## 📊 Expected Results

After implementing these changes:

| Feature | Before | After |
|---------|--------|-------|
| Data Updates | Manual refresh required | **Automatic!** |
| Search | Fires on every keystroke | Debounced (300ms delay) |
| Loading State | "Loading..." text | Beautiful skeletons |
| API Calls | Duplicate requests | Cached & deduped |
| User Experience | Frustrating | **Smooth & fast!** |

---

## 🚀 Next Steps

1. Start with **Menu module** (easiest)
2. Then **Inventory module** (most important)
3. Then **Dashboard** (high visibility)
4. Finally **Sales Report** and others

Each page takes ~15-30 minutes to migrate!

---

## 💡 Pro Tips

- **Always use the custom hooks** from `useApi.ts` - they handle everything automatically
- **Add loading skeletons** instead of spinners - looks more professional
- **Use debounce for search** - prevents API spam
- **Check React Query DevTools** in development to see caching in action
- **Don't call `refetch()` manually** - mutations handle it automatically

---

**Ready to implement?** Start with one page and watch the magic happen! ✨

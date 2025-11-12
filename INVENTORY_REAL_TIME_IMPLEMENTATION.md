# INVENTORY REAL-TIME UPDATES - Implementation Guide

## Status: Ready to Implement

The inventory module currently uses `useCallback` hooks which don't provide auto-refresh or cache management. We need to convert it to React Query.

---

## 🎯 What Needs To Be Done

Convert `use-inventoryAPI.ts` from manual fetch callbacks to React Query hooks with automatic:
- **Cache management**
- **Auto-refresh**
- **Cache invalidation** on mutations
- **Optimistic updates**

---

## 📝 Implementation Pattern

### Before (Current - Manual Fetch):
```typescript
// use-inventoryAPI.ts (CURRENT)
const listItems = useCallback(async () => {
  const response = await fetch(`${API_BASE_URL}/api/inventory`);
  return await response.json();
}, [API_BASE_URL]);

// Usage in component
const [items, setItems] = useState([]);
useEffect(() => {
  listItems().then(setItems);
}, []);
// ❌ No auto-refresh
// ❌ Have to manually refresh after add/update/delete
```

### After (React Query - Auto-Refresh):
```typescript
// use-inventoryAPI.ts (NEW)
export function useInventoryList() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/inventory`);
      return await response.json();
    },
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAddInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item) => {
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "POST",
        body: JSON.stringify(item),
      });
      return await response.json();
    },
    onSuccess: () => {
      // Auto-refresh inventory list!
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "low-stock"] });
      toast.success("Item added!");
    },
  });
}

// Usage in component
const { data: items, isLoading } = useInventoryList();
const addMutation = useAddInventory();

// ✅ Auto-refreshes every 2 minutes
// ✅ Automatically refreshes after add/update/delete
```

---

## 🔄 Complete Conversion Guide

### Step 1: Create New React Query Hook File

Create `frontend/app/Features/Inventory/hook/use-inventoryQuery.ts`:

```typescript
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// =============================================================================
// MASTER INVENTORY QUERIES
// =============================================================================

export function useInventoryList() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAddInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "out-of-stock"] });
      toast.success("Inventory item added successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
}

export function useUpdateInventory(id: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const cleanedItem = {
        ...item,
        expiration_date: item.expiration_date?.trim() || null,
      };
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(cleanedItem),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Inventory item updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
}

export function useDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Inventory item deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });
}

// =============================================================================
// TODAY INVENTORY QUERIES
// =============================================================================

export function useTodayInventoryList() {
  return useQuery({
    queryKey: ["inventory-today"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    refetchInterval: 2 * 60 * 1000,
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useAddTodayInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-today`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-today"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Today inventory added!");
    },
  });
}

// Add similar mutations for update/delete today inventory

// =============================================================================
// SURPLUS INVENTORY QUERIES
// =============================================================================

export function useSurplusInventoryList() {
  return useQuery({
    queryKey: ["inventory-surplus"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-surplus`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Less critical
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Add mutations for surplus

// =============================================================================
// SPOILAGE QUERIES
// =============================================================================

export function useSpoilageList() {
  return useQuery({
    queryKey: ["inventory-spoilage"],
    queryFn: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/inventory-spoilage`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Add mutations for spoilage
```

---

### Step 2: Update Components to Use New Hooks

#### Example: Master Inventory List Page

**Before**:
```typescript
// page.tsx (OLD)
const { listItems } = useInventoryAPI();
const [items, setItems] = useState([]);

useEffect(() => {
  listItems().then(setItems);
}, []);

return <Table data={items} />;
```

**After**:
```typescript
// page.tsx (NEW)
import { useInventoryList, useDeleteInventory } from '../hook/use-inventoryQuery';
import { TableSkeleton } from '@/app/components/ui/skeleton';

const { data: items, isLoading } = useInventoryList();
const deleteMutation = useDeleteInventory();

if (isLoading) return <TableSkeleton rows={10} columns={6} />;

return (
  <Table
    data={items}
    onDelete={(id) => deleteMutation.mutate(id)}
    // Data auto-refreshes after delete!
  />
);
```

---

## 📊 Cache Invalidation Strategy

When user performs action, invalidate related queries:

| Action | Invalidate Queries |
|--------|-------------------|
| Add Master Inventory | `inventory`, `dashboard/low-stock`, `dashboard/out-of-stock` |
| Update Master Inventory | `inventory`, `inventory/{id}`, `dashboard` |
| Delete Master Inventory | `inventory`, `dashboard` |
| Add Today Inventory | `inventory-today`, `dashboard/expiring` |
| Transfer to Today | `inventory`, `inventory-today`, `dashboard` |
| Transfer to Spoilage | `inventory-today`, `inventory-spoilage`, `dashboard/spoilage` |

---

## 🚀 Expected Results After Implementation

### Before:
- ❌ Manual refresh required to see changes
- ❌ Add item → have to F5 to see it in list
- ❌ Delete item → still shows until refresh
- ❌ No loading states
- ❌ Stale data

### After:
- ✅ Auto-refreshes every 2 minutes
- ✅ Add item → appears immediately in list
- ✅ Delete item → disappears immediately
- ✅ Beautiful loading skeletons
- ✅ Always fresh data
- ✅ Refreshes when switching tabs
- ✅ Dashboard updates automatically

---

## ⏱️ Time Estimate

- Master Inventory: 30 minutes
- Today Inventory: 30 minutes
- Surplus Inventory: 20 minutes
- Spoilage Inventory: 20 minutes

**Total: ~2 hours for all inventory modules**

---

## 🎯 Implementation Priority

1. **Master Inventory** (most used)
2. **Today Inventory** (most critical)
3. **Surplus Inventory**
4. **Spoilage Inventory**

---

## 📝 Checklist

For each inventory type:

- [ ] Create query hook (`useXXXList`)
- [ ] Create add mutation (`useAddXXX`)
- [ ] Create update mutation (`useUpdateXXX`)
- [ ] Create delete mutation (`useDeleteXXX`)
- [ ] Update list page to use query
- [ ] Update add page to use mutation
- [ ] Update edit page to use mutation
- [ ] Add loading skeletons
- [ ] Test auto-refresh
- [ ] Test cache invalidation

---

## 💡 Pro Tip

Keep the old `use-inventoryAPI.ts` file for reference, but create new `use-inventoryQuery.ts` with React Query. This way you can gradually migrate pages one by one without breaking existing functionality.

---

**Status**: Pattern established, ready for implementation

**Next**: Apply this same pattern to all 4 inventory types

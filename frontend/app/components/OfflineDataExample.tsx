/**
 * Example Component: Offline-First Data Viewing
 * This demonstrates how to implement offline-first data viewing
 * Users can view tables/data even when offline
 */

"use client";

import React from "react";
import { useOfflineData } from "@/app/hooks/useOfflineData";
import { STORES } from "@/app/utils/indexedDB";
import { useOffline } from "@/app/context/OfflineContext";

/**
 * Example: Inventory Table with Offline Support
 * This component will:
 * 1. Load data from IndexedDB instantly (offline support)
 * 2. Fetch fresh data from API when online
 * 3. Update IndexedDB with fresh data
 * 4. Show users if they're viewing cached data
 */
export function OfflineInventoryTable() {
  const { isOnline } = useOffline();

  const { data, loading, error, isFromCache, refetch } = useOfflineData({
    storeName: STORES.INVENTORY,
    endpoint: "/api/inventory",
    cacheKey: "all-inventory",
    autoFetch: true,
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading inventory...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error loading inventory</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
        {!isOnline && (
          <p className="text-red-600 text-sm mt-2">
            You are offline and no cached data is available.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {isFromCache && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium text-sm">
                Viewing cached data
              </p>
              <p className="text-yellow-600 text-xs">
                {isOnline
                  ? "Data is being updated in the background"
                  : "You are offline - showing last saved data"}
              </p>
            </div>
          </div>
          {isOnline && (
            <button
              onClick={refetch}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              Refresh
            </button>
          )}
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <p className="text-gray-700 text-sm">
              You are currently offline. Viewing saved data from your last session.
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data && Array.isArray(data) && data.length > 0 ? (
              data.map((item: any, index: number) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No inventory data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Data Info */}
      {data && Array.isArray(data) && (
        <div className="text-sm text-gray-500 text-right">
          Showing {data.length} {data.length === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}

/**
 * Example: Menu Items with Offline Support
 */
export function OfflineMenuTable() {
  const { isOnline } = useOffline();

  const { data, loading, error, isFromCache } = useOfflineData({
    storeName: STORES.MENU,
    endpoint: "/api/menu",
    cacheKey: "all-menu-items",
    autoFetch: true,
  });

  if (loading && !data) {
    return <div className="p-4">Loading menu...</div>;
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isFromCache && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          {isOnline
            ? "Showing cached menu (updating...)"
            : "Offline - showing cached menu"}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data &&
          Array.isArray(data) &&
          data.map((item: any) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-green-600 font-bold">
                  ${item.price}
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Example: Suppliers List with Offline Support
 */
export function OfflineSuppliersList() {
  const { isOnline } = useOffline();

  const { data, loading, error, isFromCache } = useOfflineData({
    storeName: STORES.SUPPLIERS,
    endpoint: "/api/suppliers",
    autoFetch: true,
  });

  if (loading && !data) {
    return <div className="p-4">Loading suppliers...</div>;
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
          Offline - showing last saved suppliers
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <ul className="divide-y divide-gray-200">
          {data &&
            Array.isArray(data) &&
            data.map((supplier: any) => (
              <li key={supplier.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.contact}</p>
                    {supplier.email && (
                      <p className="text-xs text-gray-500">{supplier.email}</p>
                    )}
                  </div>
                  {supplier.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {supplier.category}
                    </span>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

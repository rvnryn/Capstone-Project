/**
 * useDebounce Hook
 * Delays updating a value until user stops typing for specified delay
 * Prevents excessive API calls on every keystroke
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timer to update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes before delay expires
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Example usage:
 *
 * function SearchBar() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   // This only runs 300ms after user stops typing
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       fetchResults(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *
 *   return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
 * }
 */

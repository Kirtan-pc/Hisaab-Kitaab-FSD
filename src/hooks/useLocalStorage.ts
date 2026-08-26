// useLocalStorage — a custom hook that persists state in the browser's localStorage.
//
// WHY a custom hook?
// React's useState forgets everything when the page reloads.
// For Hisaab किताब, the shopkeeper's shop name, products, and phone number
// should survive a page refresh — otherwise they'd have to re-enter everything.
//
// This hook wraps useState + localStorage in one reusable function.
// Any component can call useLocalStorage("shopName", "") and get
// a value that persists across reloads.

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // useState accepts a function as its initial value — this is called "lazy initialization".
  // React only runs this function ONCE (on first render), not on every render.
  // This is important because reading localStorage is slower than reading a variable.
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      // If something was stored, parse it from JSON string back to a value.
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      // If localStorage is full or JSON is corrupted, fall back to initial value.
      return initialValue;
    }
  });

  // useEffect watches `value` and `key`. Whenever either changes,
  // it writes the new value to localStorage.
  // This is a "side effect" — something that happens OUTSIDE of rendering
  // (the browser's storage API is external to React).
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage can be full or disabled in private browsing — silently ignore.
    }
  }, [key, value]);

  return [value, setValue];
}

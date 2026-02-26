import { useState, useEffect } from 'react';

const CLOUD_ONLY_MODE_KEY = 'cloud-only-mode-active';
const CLOUD_BLOCKED_KEYS = new Set([
  'taskflow-tasks-basic',
  'taskflow-tasks-advanced',
  'taskflow-tasks-customize',
  'task-categories',
  'task-tags',
  'app-mode',
  'advanced-view-mode',
]);

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const cloudOnlyMode = window.localStorage.getItem(CLOUD_ONLY_MODE_KEY) === 'true';
      if (cloudOnlyMode && CLOUD_BLOCKED_KEYS.has(key)) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const cloudOnlyMode = window.localStorage.getItem(CLOUD_ONLY_MODE_KEY) === 'true';
      if (cloudOnlyMode && CLOUD_BLOCKED_KEYS.has(key)) {
        window.localStorage.removeItem(key);
        return;
      }

      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

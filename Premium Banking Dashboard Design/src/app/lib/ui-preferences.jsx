import { createContext, useContext, useEffect, useMemo, useState } from "react";

const UI_PREFERENCES_STORAGE_KEY = "synerg-ui-preferences";
const UIPreferencesContext = createContext(null);

function readStoredPreferences() {
  if (typeof window === "undefined") {
    return {
      animationsEnabled: true,
    };
  }

  try {
    const rawPreferences = window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    const parsedPreferences = rawPreferences ? JSON.parse(rawPreferences) : null;

    return {
      animationsEnabled: parsedPreferences?.animationsEnabled ?? true,
    };
  } catch {
    return {
      animationsEnabled: true,
    };
  }
}

export function UIPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const value = useMemo(
    () => ({
      animationsEnabled: preferences.animationsEnabled,
      setAnimationsEnabled(nextValue) {
        setPreferences((current) => ({
          ...current,
          animationsEnabled: Boolean(nextValue),
        }));
      },
    }),
    [preferences],
  );

  return <UIPreferencesContext.Provider value={value}>{children}</UIPreferencesContext.Provider>;
}

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext);

  if (!context) {
    throw new Error("useUIPreferences must be used inside UIPreferencesProvider.");
  }

  return context;
}

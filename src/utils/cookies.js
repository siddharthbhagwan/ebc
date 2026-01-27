// Cookie utilities for persisting user preferences

const COOKIE_EXPIRY_DAYS = 365;

/**
 * Set a cookie with the given name, value, and expiry
 */
export const setCookie = (name, value, days = COOKIE_EXPIRY_DAYS) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

/**
 * Get a cookie value by name
 */
export const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
};

/**
 * Delete a cookie by name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Preference keys
export const PREF_UNIT = "ebc_unit";
export const PREF_SHOW_LEGEND = "ebc_show_legend";

/**
 * Load user preferences from cookies
 */
export const loadPreferences = () => {
  const unit = getCookie(PREF_UNIT);
  const showLegend = getCookie(PREF_SHOW_LEGEND);

  return {
    unit: unit === "mi" ? "mi" : "km", // Default to km
    showLegend: showLegend === "false" ? false : true, // Default to true
  };
};

/**
 * Save unit preference
 */
export const saveUnitPreference = (unit) => {
  setCookie(PREF_UNIT, unit);
};

/**
 * Save legend visibility preference
 */
export const saveLegendPreference = (showLegend) => {
  setCookie(PREF_SHOW_LEGEND, showLegend.toString());
};

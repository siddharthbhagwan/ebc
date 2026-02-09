/**
 * Cookie Utilities Tests
 * Tests for cookie CRUD operations and preference persistence
 */

import {
  setCookie,
  getCookie,
  deleteCookie,
  loadPreferences,
  saveUnitPreference,
  saveLegendPreference,
  PREF_UNIT,
  PREF_SHOW_LEGEND,
} from "./cookies";

describe("Cookie Utilities", () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    });
  });

  describe("setCookie", () => {
    it("should set a cookie with the given name and value", () => {
      setCookie("test_key", "test_value");
      expect(document.cookie).toContain("test_key=test_value");
    });

    it("should set a cookie with custom expiry days", () => {
      setCookie("expiry_test", "value", 30);
      expect(document.cookie).toContain("expiry_test=value");
    });

    it("should overwrite an existing cookie", () => {
      setCookie("overwrite_test", "first");
      setCookie("overwrite_test", "second");
      expect(getCookie("overwrite_test")).toBe("second");
    });
  });

  describe("getCookie", () => {
    it("should return the value of an existing cookie", () => {
      setCookie("get_test", "hello");
      expect(getCookie("get_test")).toBe("hello");
    });

    it("should return null for a non-existent cookie", () => {
      expect(getCookie("nonexistent")).toBeNull();
    });

    it("should handle multiple cookies and return the correct one", () => {
      setCookie("cookie_a", "alpha");
      setCookie("cookie_b", "beta");
      setCookie("cookie_c", "gamma");
      expect(getCookie("cookie_b")).toBe("beta");
    });

    it("should not match partial cookie names", () => {
      setCookie("ebc_unit", "km");
      // Should not match a shorter prefix
      expect(getCookie("ebc_uni")).toBeNull();
    });
  });

  describe("deleteCookie", () => {
    it("should delete an existing cookie", () => {
      setCookie("delete_test", "value");
      expect(getCookie("delete_test")).toBe("value");
      deleteCookie("delete_test");
      expect(getCookie("delete_test")).toBeNull();
    });

    it("should not throw when deleting a non-existent cookie", () => {
      expect(() => deleteCookie("nonexistent")).not.toThrow();
    });
  });

  describe("Preference Constants", () => {
    it("should export PREF_UNIT constant", () => {
      expect(PREF_UNIT).toBe("ebc_unit");
    });

    it("should export PREF_SHOW_LEGEND constant", () => {
      expect(PREF_SHOW_LEGEND).toBe("ebc_show_legend");
    });
  });

  describe("loadPreferences", () => {
    it("should return default preferences when no cookies set", () => {
      const prefs = loadPreferences();
      expect(prefs.unit).toBe("km");
      expect(prefs.showLegend).toBe(true);
    });

    it("should load unit preference from cookie", () => {
      setCookie(PREF_UNIT, "mi");
      const prefs = loadPreferences();
      expect(prefs.unit).toBe("mi");
    });

    it("should load km unit preference from cookie", () => {
      setCookie(PREF_UNIT, "km");
      const prefs = loadPreferences();
      expect(prefs.unit).toBe("km");
    });

    it("should default to km for invalid unit values", () => {
      setCookie(PREF_UNIT, "invalid");
      const prefs = loadPreferences();
      expect(prefs.unit).toBe("km");
    });

    it("should load showLegend=true from cookie", () => {
      setCookie(PREF_SHOW_LEGEND, "true");
      const prefs = loadPreferences();
      expect(prefs.showLegend).toBe(true);
    });

    it("should load showLegend=false from cookie", () => {
      setCookie(PREF_SHOW_LEGEND, "false");
      const prefs = loadPreferences();
      expect(prefs.showLegend).toBe(false);
    });

    it("should default showLegend to true for invalid values", () => {
      setCookie(PREF_SHOW_LEGEND, "garbage");
      const prefs = loadPreferences();
      expect(prefs.showLegend).toBe(true);
    });
  });

  describe("saveUnitPreference", () => {
    it("should save km preference", () => {
      saveUnitPreference("km");
      expect(getCookie(PREF_UNIT)).toBe("km");
    });

    it("should save mi preference", () => {
      saveUnitPreference("mi");
      expect(getCookie(PREF_UNIT)).toBe("mi");
    });

    it("should overwrite previous unit preference", () => {
      saveUnitPreference("km");
      saveUnitPreference("mi");
      expect(getCookie(PREF_UNIT)).toBe("mi");
    });
  });

  describe("saveLegendPreference", () => {
    it("should save showLegend=true", () => {
      saveLegendPreference(true);
      expect(getCookie(PREF_SHOW_LEGEND)).toBe("true");
    });

    it("should save showLegend=false", () => {
      saveLegendPreference(false);
      expect(getCookie(PREF_SHOW_LEGEND)).toBe("false");
    });

    it("should persist legend preference across loads", () => {
      saveLegendPreference(false);
      const prefs = loadPreferences();
      expect(prefs.showLegend).toBe(false);
    });
  });

  describe("Preference Roundtrip", () => {
    it("should save and load unit preference correctly", () => {
      saveUnitPreference("mi");
      saveLegendPreference(false);
      const prefs = loadPreferences();
      expect(prefs.unit).toBe("mi");
      expect(prefs.showLegend).toBe(false);
    });
  });
});

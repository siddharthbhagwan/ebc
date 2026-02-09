/**
 * Trek Stats Utility Tests
 * Tests for trek statistics calculation, pass info, summit info, and sorting
 */

import {
  calculateTrekStats,
  getPassInfo,
  getSummitInfo,
  getSortedPasses,
} from "./trekStats";

describe("calculateTrekStats", () => {
  it("should return an object with all expected stat properties", () => {
    const stats = calculateTrekStats();
    expect(stats).toHaveProperty("totalDistance");
    expect(stats).toHaveProperty("totalClimb");
    expect(stats).toHaveProperty("totalDescent");
    expect(stats).toHaveProperty("maxAltitude");
    expect(stats).toHaveProperty("activeDays");
    expect(stats).toHaveProperty("restDays");
    expect(stats).toHaveProperty("totalDays");
  });

  it("should have totalDays equal to activeDays + restDays", () => {
    const stats = calculateTrekStats();
    expect(stats.totalDays).toBe(stats.activeDays + stats.restDays);
  });

  it("should have positive totalDistance", () => {
    const stats = calculateTrekStats();
    expect(stats.totalDistance).toBeGreaterThan(0);
  });

  it("should have positive totalClimb", () => {
    const stats = calculateTrekStats();
    expect(stats.totalClimb).toBeGreaterThan(0);
  });

  it("should have positive totalDescent", () => {
    const stats = calculateTrekStats();
    expect(stats.totalDescent).toBeGreaterThan(0);
  });

  it("should have maxAltitude above 17000 ft (Kala Patthar is 18,514)", () => {
    const stats = calculateTrekStats();
    expect(stats.maxAltitude).toBeGreaterThanOrEqual(17000);
  });

  it("should count rest days (at least 4: days 3, 9, 11, 17)", () => {
    const stats = calculateTrekStats();
    expect(stats.restDays).toBeGreaterThanOrEqual(4);
  });

  it("should count active days (trekking days with distance)", () => {
    const stats = calculateTrekStats();
    expect(stats.activeDays).toBeGreaterThan(0);
  });

  it("should return numeric values (not NaN)", () => {
    const stats = calculateTrekStats();
    expect(Number.isFinite(stats.totalDistance)).toBe(true);
    expect(Number.isFinite(stats.totalClimb)).toBe(true);
    expect(Number.isFinite(stats.totalDescent)).toBe(true);
    expect(Number.isFinite(stats.maxAltitude)).toBe(true);
  });
});

describe("getPassInfo", () => {
  it("should return Kongma La info for day 8", () => {
    const pass = getPassInfo(8);
    expect(pass).not.toBeNull();
    expect(pass.name).toBe("Kongma La");
    expect(pass.altitude).toBe("18,159 ft");
    expect(pass.color).toBe("#8E0000");
  });

  it("should return Cho La info for day 14", () => {
    const pass = getPassInfo(14);
    expect(pass).not.toBeNull();
    expect(pass.name).toBe("Cho La");
    expect(pass.altitude).toBe("17,782 ft");
  });

  it("should return Renjo La info for day 18", () => {
    const pass = getPassInfo(18);
    expect(pass).not.toBeNull();
    expect(pass.name).toBe("Renjo La");
    expect(pass.altitude).toBe("17,585 ft");
  });

  it("should return null for non-pass days", () => {
    expect(getPassInfo(1)).toBeNull();
    expect(getPassInfo(3)).toBeNull();
    expect(getPassInfo(5)).toBeNull();
    expect(getPassInfo(10)).toBeNull();
    expect(getPassInfo(20)).toBeNull();
  });

  it("should return null for day 0", () => {
    expect(getPassInfo(0)).toBeNull();
  });
});

describe("getSummitInfo", () => {
  it("should return Chhukung Ri info for day 7", () => {
    const summit = getSummitInfo(7);
    expect(summit).not.toBeNull();
    expect(summit.name).toBe("Chhukung Ri");
    expect(summit.altitude).toBe("18,209 ft");
    expect(summit.color).toBe("#8E0000");
  });

  it("should return Kala Patthar info for day 12", () => {
    const summit = getSummitInfo(12);
    expect(summit).not.toBeNull();
    expect(summit.name).toBe("Kala Patthar");
    expect(summit.altitude).toBe("18,514 ft");
  });

  it("should return Gokyo Ri info for day 16", () => {
    const summit = getSummitInfo(16);
    expect(summit).not.toBeNull();
    expect(summit.name).toBe("Gokyo Ri");
    expect(summit.altitude).toBe("17,575 ft");
  });

  it("should return null for non-summit days", () => {
    expect(getSummitInfo(1)).toBeNull();
    expect(getSummitInfo(3)).toBeNull();
    expect(getSummitInfo(8)).toBeNull();
    expect(getSummitInfo(14)).toBeNull();
  });

  it("should return null for day 0", () => {
    expect(getSummitInfo(0)).toBeNull();
  });
});

describe("getSortedPasses", () => {
  it("should return 7 high points", () => {
    const passes = getSortedPasses();
    expect(passes).toHaveLength(7);
  });

  it("should sort by altitude descending when order is 'desc'", () => {
    const passes = getSortedPasses("desc");
    for (let i = 0; i < passes.length - 1; i++) {
      expect(passes[i].altitude).toBeGreaterThanOrEqual(passes[i + 1].altitude);
    }
  });

  it("should sort by altitude ascending when order is 'asc'", () => {
    const passes = getSortedPasses("asc");
    for (let i = 0; i < passes.length - 1; i++) {
      expect(passes[i].altitude).toBeLessThanOrEqual(passes[i + 1].altitude);
    }
  });

  it("should sort by day order when order is 'day'", () => {
    const passes = getSortedPasses("day");
    for (let i = 0; i < passes.length - 1; i++) {
      expect(passes[i].day).toBeLessThanOrEqual(passes[i + 1].day);
    }
  });

  it("should default to descending sort", () => {
    const passes = getSortedPasses();
    expect(passes[0].altitude).toBeGreaterThanOrEqual(
      passes[passes.length - 1].altitude
    );
  });

  it("should include Kala Patthar as the highest point", () => {
    const passes = getSortedPasses("desc");
    expect(passes[0].name).toBe("Kala Patthar");
    expect(passes[0].altitude).toBe(18514);
  });

  it("should include Everest Base Camp", () => {
    const passes = getSortedPasses();
    const ebc = passes.find((p) => p.name === "Everest Base Camp");
    expect(ebc).toBeDefined();
    expect(ebc.altitude).toBe(17598);
    expect(ebc.type).toBe("basecamp");
  });

  it("should include all three passes", () => {
    const passes = getSortedPasses();
    const passNames = passes.filter((p) => p.type === "pass").map((p) => p.name);
    expect(passNames).toContain("Kongma La");
    expect(passNames).toContain("Cho La");
    expect(passNames).toContain("Renjo La");
  });

  it("should include all three summits", () => {
    const passes = getSortedPasses();
    const summitNames = passes.filter((p) => p.type === "summit").map((p) => p.name);
    expect(summitNames).toContain("Chhukung Ri");
    expect(summitNames).toContain("Kala Patthar");
    expect(summitNames).toContain("Gokyo Ri");
  });

  it("should have each high point with day, name, altitude, and type", () => {
    const passes = getSortedPasses();
    passes.forEach((pass) => {
      expect(pass).toHaveProperty("day");
      expect(pass).toHaveProperty("name");
      expect(pass).toHaveProperty("altitude");
      expect(pass).toHaveProperty("type");
      expect(typeof pass.day).toBe("number");
      expect(typeof pass.altitude).toBe("number");
    });
  });
});

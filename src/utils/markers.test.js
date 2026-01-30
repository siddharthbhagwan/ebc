import { getMarkers } from "./markers";

describe("Markers Utility", () => {
  test("Lobuche marker properties have correct text direction", () => {
    const markers = getMarkers();
    const lobuche = markers.find(m => m.properties.name === "Lobuche");
    expect(lobuche).toBeDefined();
    expect(lobuche.properties.direction).toBe("right");
  });

  test("All markers have required properties", () => {
    const markers = getMarkers();
    
    markers.forEach(marker => {
      expect(marker.point).toBeDefined();
      expect(marker.icon).toBeDefined();
      expect(marker.size).toBeDefined();
      expect(marker.properties).toBeDefined();
      expect(marker.properties.name).toBeDefined();
      expect(marker.properties.day).toBeDefined();
    });
  });
});

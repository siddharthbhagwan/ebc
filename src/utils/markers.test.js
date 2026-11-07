import { getMarkers } from "./markers";

describe("Markers Utility", () => {
  test("Lobuche marker properties have correct text direction", () => {
    const markers = getMarkers();
    const lobuche = markers.find(m => m.properties.name === "Lobuche");
    expect(lobuche).toBeDefined();
    expect(lobuche.properties.direction).toBe("right");
  });

  test("Everest uses the same flag icon as Kongma La", () => {
    const markers = getMarkers();
    const everest = markers.find((m) => m.properties.name === "Everest");
    const kongma = markers.find((m) => m.properties.name === "Kongma La");
    expect(everest).toBeDefined();
    expect(everest.icon).toBe(kongma.icon);
    expect(everest.point).toEqual([27.9881, 86.925]);
    expect(everest.properties.startAlt).toBe("29,032");
    expect(markers.filter((m) => m.properties.name === "Everest")).toHaveLength(1);
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

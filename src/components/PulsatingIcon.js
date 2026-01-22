import React, { useEffect } from "react";
import { CircleMarker } from "react-leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import L from "leaflet";

const PulsatingMarker = ({ position, color = "teal", radius = 7 }) => {
  const context = useLeafletContext();

  useEffect(() => {
    const container = context.layerContainer || context.map;

    // Create a custom pulsating icon
    const pulsingIcon = L.divIcon({
      html: `
        <div class="pulsating-marker" style="
          border-radius: 50%;
          height: ${radius * 2}px;
          width: ${radius * 2}px;
          border: 5px solid ${color};
          background: ${color};
        "></div>
      `,
      className: "",
    });

    // Add the custom icon to the map
    const marker = L.marker(position, { icon: pulsingIcon }).addTo(container);

    // Clean up
    return () => {
      container.removeLayer(marker);
    };
  }, [context, position, color, radius]);

  return (
    <>
      <style>
        {`
          @keyframes pulsate {
            0% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
            100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
          }
          .pulsating-marker {
            animation: pulsate 1s ease-out infinite;
            opacity: 0.5;
          }
        `}
      </style>
      <CircleMarker
        center={position}
        pathOptions={{ fillColor: color, color: color }}
        radius={radius}
      />
    </>
  );
};

export default PulsatingMarker;

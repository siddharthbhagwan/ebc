const fs = require('fs');
const path = require('path');

async function main() {
  const geoJsonPath = path.join(__dirname, '..', 'src', 'utils', 'geoJson.js');
  const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf-8');
  
  const dayBounds = {};
  
  // Find all route definitions (const xxx = { type: "FeatureCollection"...)
  // and extract coordinates from MultiLineString/LineString features
  
  // First, find the dayWiseDataG mapping to know which variable corresponds to which day
  const dayMappingMatch = geoJsonContent.match(/const dayWiseDataG = \{([\s\S]*?)\};[\s\n]*const getDayWiseDataG/);
  if (!dayMappingMatch) {
    console.error('Could not find dayWiseDataG mapping');
    process.exit(1);
  }
  
  const dayMapping = {};
  const mappingLines = dayMappingMatch[1].split('\n');
  mappingLines.forEach(line => {
    // Match patterns like: 1: lukla_to_phakding_1,
    const match = line.match(/^\s*(\d+)\s*:\s*(\w+)/);
    if (match) {
      dayMapping[match[1]] = match[2];
    }
  });
  
  console.log('Day mapping:', dayMapping);
  
  // For each day, find the variable and extract coordinates
  Object.entries(dayMapping).forEach(([day, varName]) => {
    // Find the start of the variable definition
    const varStartIdx = geoJsonContent.indexOf(`const ${varName} = {`);
    
    if (varStartIdx === -1) {
      console.log(`Day ${day}: Could not find variable ${varName}`);
      return;
    }
    
    // Find where this variable definition ends (look for next const or end of file)
    const nextConstIdx = geoJsonContent.indexOf('\nconst ', varStartIdx + 1);
    const varContent = geoJsonContent.slice(varStartIdx, nextConstIdx > 0 ? nextConstIdx : undefined);
    
    // Extract all coordinate triplets [lng, lat, alt] from MultiLineString/LineString
    const allCoords = [];
    
    // Only process if this is MultiLineString or LineString (has route data)
    if (varContent.includes('"MultiLineString"') || varContent.includes('"LineString"')) {
      // Extract all [number, number, number] patterns (coordinates)
      const coordMatches = varContent.matchAll(/\[\s*(86\.\d+),\s*(27\.\d+)/g);
      
      for (const match of coordMatches) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        if (!isNaN(lng) && !isNaN(lat)) {
          allCoords.push([lat, lng]);
        }
      }
    }
    
    if (allCoords.length > 0) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      allCoords.forEach(([lat, lng]) => {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
      
      dayBounds[day] = { minLat, maxLat, minLng, maxLng, coordCount: allCoords.length };
      console.log(`Day ${day}: ${allCoords.length} route coords, bounds: [${minLat.toFixed(4)}, ${minLng.toFixed(4)}] to [${maxLat.toFixed(4)}, ${maxLng.toFixed(4)}]`);
    } else {
      console.log(`Day ${day}: No route coordinates found (likely rest day)`);
    }
  });
  
  // Add padding and generate output
  const addPadding = (bounds, paddingPercent) => {
    const latRange = bounds.maxLat - bounds.minLat;
    const lngRange = bounds.maxLng - bounds.minLng;
    const latPad = latRange * paddingPercent;
    const lngPad = lngRange * paddingPercent;
    return {
      sw: [bounds.minLat - latPad, bounds.minLng - lngPad],
      ne: [bounds.maxLat + latPad, bounds.maxLng + lngPad]
    };
  };
  
  const preCalculatedBounds = {};
  
  Object.keys(dayBounds).sort((a, b) => parseInt(a) - parseInt(b)).forEach(day => {
    const bounds = dayBounds[day];
    const desktopBounds = addPadding(bounds, 0.10);
    const mobileBounds = addPadding(bounds, 0.25);
    
    preCalculatedBounds[day] = {
      desktop: [
        [parseFloat(desktopBounds.sw[0].toFixed(5)), parseFloat(desktopBounds.sw[1].toFixed(5))],
        [parseFloat(desktopBounds.ne[0].toFixed(5)), parseFloat(desktopBounds.ne[1].toFixed(5))]
      ],
      mobile: [
        [parseFloat(mobileBounds.sw[0].toFixed(5)), parseFloat(mobileBounds.sw[1].toFixed(5))],
        [parseFloat(mobileBounds.ne[0].toFixed(5)), parseFloat(mobileBounds.ne[1].toFixed(5))]
      ]
    };
  });
  
  // Generate output
  let output = 'export const preCalculatedBounds = {\n';
  
  Object.keys(preCalculatedBounds).sort((a, b) => parseInt(a) - parseInt(b)).forEach((day, idx, arr) => {
    const bounds = preCalculatedBounds[day];
    output += `  "${day}": {\n`;
    output += `    "desktop": [\n`;
    output += `      [\n        ${bounds.desktop[0][0]},\n        ${bounds.desktop[0][1]}\n      ],\n`;
    output += `      [\n        ${bounds.desktop[1][0]},\n        ${bounds.desktop[1][1]}\n      ]\n`;
    output += `    ],\n`;
    output += `    "mobile": [\n`;
    output += `      [\n        ${bounds.mobile[0][0]},\n        ${bounds.mobile[0][1]}\n      ],\n`;
    output += `      [\n        ${bounds.mobile[1][0]},\n        ${bounds.mobile[1][1]}\n      ]\n`;
    output += `    ]\n`;
    output += `  }${idx < arr.length - 1 ? ',' : ''}\n`;
  });
  
  output += '};\n';
  
  const outputPath = path.join(__dirname, '..', 'src', 'utils', 'preCalculatedBounds.js');
  fs.writeFileSync(outputPath, output);
  
  console.log(`\nSuccessfully regenerated preCalculatedBounds.js with ${Object.keys(preCalculatedBounds).length} days`);
}

main().catch(console.error);

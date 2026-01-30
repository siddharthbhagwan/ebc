import { getDayWiseDataG } from './geoJson';

/**
 * Calculate comprehensive trek statistics from route data
 */
export const calculateTrekStats = () => {
  const routes = getDayWiseDataG();
  
  let totalDistance = 0;
  let totalClimb = 0;
  let totalDescent = 0;
  let maxAltitude = 0;
  let activeDays = 0;
  let restDays = 0;

  Object.keys(routes).forEach(day => {
    const route = routes[day];
    if (!route?.features?.[0]?.properties) return;
    
    const props = route.features[0].properties;
    
    // Count days
    if (props.time === "Rest Day") {
      restDays++;
    } else {
      activeDays++;
    }
    
    // Parse distance (format: "X mi / Y km")
    if (props.distance) {
      const kmMatch = props.distance.match(/([\d.]+)\s*km/i);
      if (kmMatch) {
        totalDistance += parseFloat(kmMatch[1]);
      }
    }
    
    // Parse elevation changes
    if (props.total_climb) {
      const climbFt = parseFloat(props.total_climb.replace(/,/g, ''));
      if (!isNaN(climbFt)) totalClimb += climbFt;
    }
    
    if (props.descent) {
      const descentFt = parseFloat(props.descent.replace(/,/g, ''));
      if (!isNaN(descentFt)) totalDescent += descentFt;
    }
    
    // Track max altitude
    ['startAlt', 'peakAlt', 'endAlt'].forEach(key => {
      if (props[key]) {
        const altFt = parseFloat(props[key].replace(/,/g, ''));
        if (!isNaN(altFt) && altFt > maxAltitude) maxAltitude = altFt;
      }
    });
  });

  return {
    totalDistance: Math.round(totalDistance * 10) / 10, // km
    totalClimb: Math.round(totalClimb), // ft
    totalDescent: Math.round(totalDescent), // ft
    maxAltitude: Math.round(maxAltitude), // ft
    activeDays,
    restDays,
    totalDays: activeDays + restDays
  };
};

/**
 * Get pass information for a specific day
 */
export const getPassInfo = (day) => {
  const passes = {
    8: { name: 'Kongma La', altitude: '18,159 ft', color: '#8E0000' },
    14: { name: 'Cho La', altitude: '17,782 ft', color: '#8E0000' },
    18: { name: 'Renjo La', altitude: '17,585 ft', color: '#8E0000' }
  };
  return passes[day] || null;
};

/**
 * Get summit information for a specific day
 */
export const getSummitInfo = (day) => {
  const summits = {
    7: { name: 'Chhukung Ri', altitude: '18,209 ft', color: '#8E0000' },
    12: { name: 'Kala Patthar', altitude: '18,514 ft', color: '#8E0000' },
    16: { name: 'Gokyo Ri', altitude: '17,575 ft', color: '#8E0000' }
  };
  return summits[day] || null;
};

/**
 * Get sorted high points list (passes, summits, and EBC)
 * @param {string} order - 'desc', 'asc', or 'day'
 */
export const getSortedPasses = (order = 'desc') => {
  const highPoints = [
    { day: 7, name: 'Chhukung Ri', altitude: 18209, type: 'summit' },
    { day: 8, name: 'Kongma La', altitude: 18159, type: 'pass' },
    { day: 12, name: 'Kala Patthar', altitude: 18514, type: 'summit' },
    { day: 11, name: 'Everest Base Camp', altitude: 17598, type: 'basecamp' },
    { day: 14, name: 'Cho La', altitude: 17782, type: 'pass' },
    { day: 16, name: 'Gokyo Ri', altitude: 17575, type: 'summit' },
    { day: 18, name: 'Renjo La', altitude: 17585, type: 'pass' }
  ];

  if (order === 'desc') {
    return highPoints.sort((a, b) => b.altitude - a.altitude);
  } else if (order === 'asc') {
    return highPoints.sort((a, b) => a.altitude - b.altitude);
  } else {
    // day order
    return highPoints.sort((a, b) => a.day - b.day);
  }
};

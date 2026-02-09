import { useState } from "react";
import { getDayWiseDataG } from "../utils/geoJson";

const routes = getDayWiseDataG();
// DAYS includes Day 0 through Day 20
const DAYS = Object.keys(routes)
  .map(Number)
  .sort((a, b) => a - b);

// Find the index of Day 1 (first actual trek day) and the max day (20)
const DAY_1_INDEX = DAYS.indexOf(1);
const DAY_0_INDEX = DAYS.indexOf(0);
const MAX_DAY_INDEX = DAYS.length - 1; // Day 20

const useDays = (currentDay, dispatcher) => {
  const currentDayInt = parseInt(currentDay);
  const initialIndex = DAYS.indexOf(currentDayInt);

  const [dayIndex, setDayIndex] = useState(
    initialIndex !== -1 ? initialIndex : DAY_1_INDEX,
  );

  if (DAYS[dayIndex] !== currentDayInt && initialIndex !== -1) {
    setDayIndex(initialIndex);
  }

  const nextDay = () => {
    let newIndex = dayIndex + 1;
    // From Day 20 (max), wrap to Day 0
    if (newIndex > MAX_DAY_INDEX) {
      newIndex = DAY_0_INDEX;
    }
    const targetDay = DAYS[newIndex];
    const targetFeature = routes[targetDay].features[0];
    setDayIndex(newIndex);
    dispatcher(targetFeature.properties);
    return targetFeature;
  };

  const prevDay = () => {
    let newIndex = dayIndex - 1;
    // From Day 0, wrap to Day 20 (max)
    if (newIndex < DAY_0_INDEX) {
      newIndex = MAX_DAY_INDEX;
    }
    const targetDay = DAYS[newIndex];
    const targetFeature = routes[targetDay].features[0];
    setDayIndex(newIndex);
    dispatcher(targetFeature.properties);
    return targetFeature;
  };

  return { nextDay, prevDay };
};

export default useDays;

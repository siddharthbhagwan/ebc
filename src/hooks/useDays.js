import { useState } from "react";
import { getDayWiseDataG } from "../utils/geoJson";

const routes = getDayWiseDataG();
const DAYS = Object.keys(routes)
  .map(Number)
  .sort((a, b) => a - b);

const useDays = (currentDay, dispatcher) => {
  const currentDayInt = parseInt(currentDay);
  const initialIndex = DAYS.indexOf(currentDayInt);

  const [dayIndex, setDayIndex] = useState(
    initialIndex !== -1 ? initialIndex : 0,
  );

  if (DAYS[dayIndex] !== currentDayInt && initialIndex !== -1) {
    setDayIndex(initialIndex);
  }

  const nextDay = () => {
    let newIndex = dayIndex + 1;
    if (newIndex >= DAYS.length) {
      newIndex = 0;
    }
    const targetDay = DAYS[newIndex];
    const targetFeature = routes[targetDay].features[0];
    setDayIndex(newIndex);
    dispatcher(targetFeature.properties);
    return targetFeature;
  };

  const prevDay = () => {
    let newIndex = dayIndex - 1;
    if (newIndex < 0) {
      newIndex = DAYS.length - 1;
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

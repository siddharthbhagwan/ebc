import { useRef } from "react";
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
  // Read at call time so a key handler closed over an older render still
  // steps from the day on screen, including a second press before re-render.
  const dayRef = useRef(currentDay);
  const seenProp = useRef(currentDay);
  if (seenProp.current !== currentDay) {
    seenProp.current = currentDay;
    dayRef.current = currentDay;
  }

  const step = (delta, skipOverview = false) => {
    let index = DAYS.indexOf(parseInt(dayRef.current, 10));
    if (index === -1) index = DAY_1_INDEX;
    let newIndex = index + delta;
    if (newIndex > MAX_DAY_INDEX) newIndex = DAY_0_INDEX;
    if (newIndex < DAY_0_INDEX) newIndex = MAX_DAY_INDEX;
    // Left from day 1 stays on the last walking day instead of the overview.
    if (skipOverview && delta < 0 && DAYS[newIndex] === 0) newIndex = MAX_DAY_INDEX;
    const targetFeature = routes[DAYS[newIndex]].features[0];
    dayRef.current = String(DAYS[newIndex]);
    dispatcher(targetFeature.properties);
    return targetFeature;
  };

  return {
    nextDay: (skipOverview) => step(1, skipOverview),
    prevDay: (skipOverview) => step(-1, skipOverview),
  };
};

export default useDays;

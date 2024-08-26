import React, { useState } from "react";

import { getDayWiseDataG } from "../utils/geoJson";
import { getDayWiseDataP } from "../utils/polylines";

const routesG = getDayWiseDataG();
const routesP = getDayWiseDataP();

const ROUTES = { ...routesG, ...routesP };
const DAYS = Object.keys(ROUTES);

const useDays = (currentDay, dispatcher) => {
  const [day, setDay] = useState(parseInt(currentDay));

  const nextDay = () => {
    let targetDay = day + 1;
    if (targetDay > 19) {
      targetDay = 1;
      // days never skip more than one day
    } else if (!ROUTES[targetDay]) targetDay = targetDay + 1;

    let targetRoute = ROUTES[targetDay];
    const targetProps =
      targetRoute.properties || targetRoute.features[0].properties;
    dispatcher(targetProps);
    setDay(targetDay);
  };

  const prevDay = () => {
    let targetDay = day - 1;
    if (targetDay < 0) targetDay = DAYS[DAYS.length - 1];

    let targetRoute = ROUTES[targetDay];

    if (!targetRoute) {
      targetDay = targetDay - 1;
      targetRoute = ROUTES[targetDay];
    }

    const targetProps =
      targetRoute.properties || targetRoute.features[0].properties;
    dispatcher(targetProps);
    setDay(targetDay);
  };

  return { nextDay, prevDay };
};

export default useDays;

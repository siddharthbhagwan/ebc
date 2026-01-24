import { combineReducers, createStore } from "redux";
import { routeReducer } from "../reducers/routeReducer";
import { mapStateReducer } from "../reducers/mapStateReducer";

export const store = createStore(
  combineReducers({
    route: routeReducer,
    mapState: mapStateReducer,
  }),
);

import { combineReducers, createStore } from "redux";
import { detailsReducer } from "../reducers/detailsReducer";

export const store = createStore(
  combineReducers({
    details: detailsReducer
  })
);

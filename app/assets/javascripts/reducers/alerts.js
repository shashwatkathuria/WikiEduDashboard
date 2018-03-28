import { RECEIVE_ALERTS, SORT_ALERTS, FILTER_ALERTS } from "../constants";
import { sortByKey } from '../utils/model_utils';

const initialState = {
  alerts: [],
  sortKey: null,
  selectedFilters: [
    'ArticlesForDeletionAlert',
    'DiscretionarySanctionsEditAlert',
  ],
};

const SORT_DESCENDING = {
  created_at: true,
};

export default function alerts(state = initialState, action) {
  switch (action.type) {
    case RECEIVE_ALERTS: {
      const newState = { ...state };
      const sortedAlerts = sortByKey(action.data.alerts, 'created_at', null, SORT_DESCENDING.created_at);
      newState.alerts = sortedAlerts.newModels;
      newState.sortKey = sortedAlerts.newKey;
      return newState;
    }
    case SORT_ALERTS: {
      const newState = { ...state };
      const sortedAlerts = sortByKey(state.alerts, action.key, state.sortKey, SORT_DESCENDING[action.key]);
      newState.alerts = sortedAlerts.newModels;
      newState.sortKey = sortedAlerts.newKey;
      return newState;
    }
    case FILTER_ALERTS: {
      const newState = { ...state };
      newState.selectedFilters = action.selectedFilters;
      return newState;
    }
    default:
      return state;
  }
}

// Action Type Constants
export const SET_ITEMS = 'SET_ITEMS';
export const ADD_ITEM = 'ADD_ITEM';
export const UPDATE_ITEM = 'UPDATE_ITEM';
export const DELETE_ITEM = 'DELETE_ITEM';
export const SET_LOADING = 'SET_LOADING';
export const SET_ERROR = 'SET_ERROR';
export const SET_FILTER = 'SET_FILTER';
export const SET_SEARCH = 'SET_SEARCH';
export const SET_STATS = 'SET_STATS';

export const initialState = {
  items: [], // Active list (currently viewed entity)
  students: [],
  companies: [],
  drives: [],
  applications: [],
  interviews: [],
  stats: null,
  loading: false,
  error: null,
  filters: {
    department: '',
    status: '',
    driveStatus: ''
  },
  search: ''
};

export const placementReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case SET_ITEMS:
      // Support payload as array or as object with entity & data
      if (action.payload && action.payload.entity && Array.isArray(action.payload.data)) {
        return {
          ...state,
          items: action.payload.data,
          [action.payload.entity]: action.payload.data,
          loading: false,
          error: null
        };
      }
      return {
        ...state,
        items: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
        error: null
      };
    case ADD_ITEM:
      if (action.payload && action.payload.entity && action.payload.data) {
        const entityKey = action.payload.entity;
        const newItem = action.payload.data;
        return {
          ...state,
          [entityKey]: [newItem, ...state[entityKey]],
          items: [newItem, ...state.items],
          loading: false,
          error: null
        };
      }
      return {
        ...state,
        items: [action.payload, ...state.items],
        loading: false,
        error: null
      };
    case UPDATE_ITEM:
      if (action.payload && action.payload.entity && action.payload.data) {
        const entityKey = action.payload.entity;
        const updatedItem = action.payload.data;
        const targetId = updatedItem._id || updatedItem.id;
        
        return {
          ...state,
          [entityKey]: state[entityKey].map(item => 
            (item._id === targetId || item.id === targetId) ? updatedItem : item
          ),
          items: state.items.map(item => 
            (item._id === targetId || item.id === targetId) ? updatedItem : item
          ),
          loading: false,
          error: null
        };
      }
      const targetId = action.payload._id || action.payload.id;
      return {
        ...state,
        items: state.items.map(item => 
          (item._id === targetId || item.id === targetId) ? action.payload : item
        ),
        loading: false,
        error: null
      };
    case DELETE_ITEM:
      if (action.payload && action.payload.entity && action.payload.id) {
        const entityKey = action.payload.entity;
        const idToDelete = action.payload.id;
        return {
          ...state,
          [entityKey]: state[entityKey].filter(item => item._id !== idToDelete && item.id !== idToDelete),
          items: state.items.filter(item => item._id !== idToDelete && item.id !== idToDelete),
          loading: false,
          error: null
        };
      }
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload && item.id !== action.payload),
        loading: false,
        error: null
      };
    case SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case SET_SEARCH:
      return {
        ...state,
        search: action.payload
      };
    case SET_STATS:
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

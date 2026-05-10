type errorDetail = {
  type: string;
  detail: string;
  id: number;
  timeStamp: string;
};

interface errorState {
  errors: errorDetail[];
}

type errorAction =
  | { type: 'ADD_ERROR'; payload: errorDetail }
  | { type: 'REMOVE_ERROR'; payload: errorDetail['id'] }
  | { type: 'CLEAR_ERRORS' };

const errorReducer = (state: errorState, action: errorAction): errorState => {
  switch (action.type) {
    case 'ADD_ERROR':
      return {
        errors: [
          ...state.errors,
          {
            type: action.payload.type,
            detail: action.payload.detail,
            id: action.payload.id,
            timeStamp: new Date().toISOString(),
          },
        ],
      };
    case 'REMOVE_ERROR':
      return {
        errors: state?.errors?.filter((error) => error.id !== action.payload) || [],
      };
    case 'CLEAR_ERRORS':
      return { errors: [] };
    default:
      return state;
  }
};

export { type errorState, type errorAction, errorReducer };

import { createContext, useReducer } from 'react';
import { type errorState, type errorAction, errorReducer } from '@reducers/errorReducer';

interface ErrorContextProps {
  children: React.ReactNode;
}
const error = createContext<{
  errors: errorState['errors'];
  dispatch: React.Dispatch<errorAction>;
}>({
  errors: [],
  dispatch: () => null,
});

const ErrorProvider = ({ children }: ErrorContextProps) => {
  const [state, dispatch] = useReducer(errorReducer, { errors: [] });

  return <error.Provider value={{ errors: state.errors, dispatch }}>{children}</error.Provider>;
};

export { ErrorProvider };

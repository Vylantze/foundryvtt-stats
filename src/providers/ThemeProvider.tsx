import React, { createContext, useContext, useReducer, Dispatch, PropsWithChildren } from 'react';

interface IThemeState {
  theme: 'light' | 'dark'
}

const defaultTheme = 'dark';

// Context lets us pass a value deep into the component tree
// without explicitly threading it through every component.
// Create a context for the current theme (with 'dark' as the default).
const ThemeContext = createContext<'light' | 'dark'>(defaultTheme);
const ThemeDispatchContext = createContext<Dispatch<IThemeState> | undefined>(undefined);

const useTheme = function () {
  return useContext(ThemeContext);
}

const useThemeDispatch = function (): Dispatch<IThemeState> {
  const dispatch = useContext(ThemeDispatchContext);
  if (dispatch === undefined) {
    throw new Error('[ThemeProvider][useThemeDispatch] Dispatch is undefined. This must be within a ThemeProvider.');
  }
  return dispatch;
}

export { useTheme, useThemeDispatch };
export default function ThemeProvider({ children }: PropsWithChildren) {
  const reducer = function (state: IThemeState, action: IThemeState) {
    return {
      ...state,
      theme: action.theme
    };
  }
  const [state, dispatch] = useReducer(reducer, { theme: 'dark' });

  return (
    <ThemeContext.Provider value={state.theme}>
      <ThemeDispatchContext.Provider value={dispatch}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeContext.Provider>
  )
}
/*
  ThemeContext.js

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

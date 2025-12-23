import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a mock store for testing
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers here
      auth: (state = { user: null, token: null }) => state,
    },
    preloadedState: initialState,
  });
};

// Create Material-UI theme
const theme = createTheme();

// Custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };

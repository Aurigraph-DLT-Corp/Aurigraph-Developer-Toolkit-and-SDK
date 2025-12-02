import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App'
import { store } from './store'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00BFA5' },
    secondary: { main: '#FF6B6B' },
    background: { default: '#0A0E27', paper: '#1A1F3A' },
  },
  typography: { fontFamily: 'Inter, system-ui, sans-serif' },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)

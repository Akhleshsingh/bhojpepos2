import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { store } from './app/store'
import { setCurrentLang } from './utils/i18n'
import './index.css'

// Keep i18n module in sync with Redux lang state
store.subscribe(() => {
  const lang = store.getState().ui?.currentLang
  if (lang) setCurrentLang(lang)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)

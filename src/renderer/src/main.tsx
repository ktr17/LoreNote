// import './assets/main.css'

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Setting from './components/Setting.tsx';
import './assets/main.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route
          path="/setting"
          element={
            <Setting
              onClose={() => {
                window.close();
              }}
            />
          }
        />
        <Route path="/" element={<App />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);

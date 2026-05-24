import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@talon-sandbox/tokens/css';
import '@talon-sandbox/react/styles';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

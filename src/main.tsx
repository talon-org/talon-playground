import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// @talon-sandbox/react/styles already embeds the full token CSS (dist/styles.css
// begins with the complete :root { --bg-0, --fg-0, --acc, … } block), so
// @talon-sandbox/tokens/css would be a duplicate and is omitted here.
import '@talon-sandbox/react/styles';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

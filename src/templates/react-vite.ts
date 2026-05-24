import type { Project } from '../types';

export const reactViteTemplate: Project = {
  template: 'react-vite',
  entry: 'src/App.tsx',
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "react-vite-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
`,
    },
    {
      path: 'src/main.tsx',
      content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    },
    {
      path: 'src/App.tsx',
      content: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>React + Vite Counter</h1>
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.tsx</code> and save to see HMR in action.</p>
      </div>
      <p className="read-the-docs">
        Running on Talon Sandbox
      </p>
    </div>
  );
}
`,
    },
    {
      path: 'README.md',
      content: `# React + Vite 模板

这是 **React + Vite** 模板，点击顶部 **Run** 按钮启动。

- 热更新 (HMR) 已配置，编辑 \`src/App.tsx\` 保存后立即生效。
- 运行在 Talon Sandbox 云端容器中，无需本地安装任何依赖。
`,
    },
    {
      path: 'src/index.css',
      content: `:root {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  color: #213547;
  background-color: #f9fafb;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1d4ed8;
}

.card {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,.12);
  margin: 1.5rem auto;
  max-width: 480px;
}

button {
  padding: .6rem 1.4rem;
  font-size: 1rem;
  background: #1d4ed8;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:hover { background: #1e40af; }

.read-the-docs { color: #888; font-size: .85rem; }
`,
    },
  ],
};

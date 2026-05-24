import type { Project } from '../types';

export const vueViteTemplate: Project = {
  template: 'vue-vite',
  entry: 'src/App.vue',
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "vue-vite-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.29"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.5",
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
    <title>Vue + Vite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`,
    },
    {
      path: 'tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`,
    },
    {
      path: 'README.md',
      content: `# Vue 3 + Vite 模板

这是 **Vue 3 + Vite** 模板，点击顶部 **Run** 按钮启动。

- 热更新 (HMR) 已配置，编辑 \`src/App.vue\` 保存后立即生效。
- 运行在 Talon Sandbox 云端容器中，无需本地安装任何依赖。
`,
    },
    {
      path: 'src/App.vue',
      content: `<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div class="container">
    <h1>Vue 3 + Vite Counter</h1>
    <div class="card">
      <button @click="count++">count is {{ count }}</button>
      <p>Edit <code>src/App.vue</code> to see HMR updates.</p>
    </div>
    <p class="read-the-docs">Running on Talon Sandbox</p>
  </div>
</template>

<style scoped>
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  font-family: system-ui, sans-serif;
}
h1 { font-size: 2.5rem; font-weight: 700; color: #41b883; }
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
  background: #41b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover { background: #35a070; }
.read-the-docs { color: #888; font-size: .85rem; }
</style>
`,
    },
  ],
};

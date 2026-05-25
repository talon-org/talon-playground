import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 读取所有前缀（含空前缀）的环境变量，USE_LOCAL_UI 无 VITE_ 前缀也能拿到
  // 用 import.meta.url 派生 cwd，避免依赖 process（playground 无 @types/node）
  const cwd = new URL('.', import.meta.url).pathname
  const env = loadEnv(mode, cwd, '')

  // 本地 UI 源码调试开关：
  //   开发期：USE_LOCAL_UI=1 npm run dev  或在 .env.local 写 VITE_USE_LOCAL_UI=1
  //   CI / npm run build 不传此变量，走 npm 安装的 dist 版本
  const useLocalUI =
    env.VITE_USE_LOCAL_UI === '1' || env.USE_LOCAL_UI === '1'

  // ui 包源码根目录（URL.pathname，无需 node:path / @types/node）
  const uiSrc = new URL(
    '../talon-sandbox-ui/packages/react/src',
    import.meta.url,
  ).pathname

  return {
    plugins: [react()],
    resolve: {
      alias: useLocalUI
        ? [
            // CSS 入口：dist/styles.css 的源码等价替代
            // 指向本项目内的 local-ui-styles.css，
            // 该文件用 @import 拼合了 tokens + 三个 src/styles/*.css
            {
              find: '@talon-sandbox/react/styles',
              replacement: new URL(
                'src/styles/local-ui-styles.css',
                import.meta.url,
              ).pathname,
            },
            // JS 入口：直接读 src/index.ts，Vite 实时 HMR
            {
              find: '@talon-sandbox/react',
              replacement: uiSrc,
            },
          ]
        : [],
    },
    server: {
      port: 5273,
      strictPort: true,
    },
    optimizeDeps: {
      include: ['monaco-editor'],
    },
  }
})

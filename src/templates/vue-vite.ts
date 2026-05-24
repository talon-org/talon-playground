import type { Project } from '../types';

export const vueViteTemplate: Project = {
  template: 'vue-vite',
  entry: 'src/App.vue',
  files: [
    {
      path: 'src/App.vue',
      content: '// W3 will populate this template\n',
    },
  ],
};

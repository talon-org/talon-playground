import type { Project } from '../types';

export const reactViteTemplate: Project = {
  template: 'react-vite',
  entry: 'src/App.tsx',
  files: [
    {
      path: 'src/App.tsx',
      content: '// W3 will populate this template\n',
    },
  ],
};

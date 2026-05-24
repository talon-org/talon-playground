import type { Project } from '../types';

export const nodeExpressTemplate: Project = {
  template: 'node-express',
  entry: 'index.js',
  files: [
    {
      path: 'index.js',
      content: '// W3 will populate this template\n',
    },
  ],
};

import type { Project } from '../types';

export const flaskTemplate: Project = {
  template: 'flask',
  entry: 'app.py',
  files: [
    {
      path: 'app.py',
      content: '# W3 will populate this template\n',
    },
  ],
};

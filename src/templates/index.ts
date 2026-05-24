import type { TemplateId, Project } from '../types';
import { staticTemplate } from './static';
import { reactViteTemplate } from './react-vite';
import { vueViteTemplate } from './vue-vite';
import { nodeExpressTemplate } from './node-express';
import { flaskTemplate } from './flask';

export const TEMPLATES: Record<TemplateId, Project> = {
  static: staticTemplate,
  'react-vite': reactViteTemplate,
  'vue-vite': vueViteTemplate,
  'node-express': nodeExpressTemplate,
  flask: flaskTemplate,
};

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  static: 'Static HTML/CSS/JS',
  'react-vite': 'React + Vite',
  'vue-vite': 'Vue + Vite',
  'node-express': 'Node Express',
  flask: 'Python Flask',
};

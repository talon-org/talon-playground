import type { Project } from '../types';

export const nodeExpressTemplate: Project = {
  template: 'node-express',
  entry: 'index.js',
  files: [
    {
      path: 'package.json',
      content: `{
  "name": "node-express-app",
  "version": "1.0.0",
  "description": "Express server running on Talon Sandbox",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
`,
    },
    {
      path: 'index.js',
      content: `const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(\`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello from Talon Sandbox</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; }
    h1 { color: #16a34a; }
    .endpoint { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
    code { background: #e5e7eb; padding: .2rem .4rem; border-radius: 3px; font-size: .9rem; }
  </style>
</head>
<body>
  <h1>Hello from Talon Sandbox</h1>
  <p>Express server is running on port \${PORT}.</p>
  <div class="endpoint">
    <strong>GET /</strong> — this page
  </div>
  <div class="endpoint">
    <strong>GET /api/hello</strong> — returns <code>{"message":"hello","timestamp":"..."}</code>
  </div>
</body>
</html>\`);
});

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'hello',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server listening on http://0.0.0.0:\${PORT}\`);
});
`,
    },
  ],
};

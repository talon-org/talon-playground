import type { Project } from '../types';

export const staticTemplate: Project = {
  template: 'static',
  entry: 'index.html',
  files: [
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hello Talon</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello Talon</h1>
    <p>Edit this file to get started.</p>
    <script src="script.js"></script>
  </body>
</html>
`,
    },
    {
      path: 'style.css',
      content: `body {
  font-family: system-ui, sans-serif;
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  background: #f9fafb;
  color: #111827;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1d4ed8;
}
`,
    },
    {
      path: 'README.md',
      content: `# Static HTML/CSS/JS 模板

这是 **静态 HTML/CSS/JS** 模板，点击顶部 **Run** 按钮预览。

- 无需服务器，直接在浏览器中渲染。
- 编辑 \`index.html\`、\`style.css\`、\`script.js\`，点 Run 立即查看效果。
`,
    },
    {
      path: 'script.js',
      content: `console.log('Hello from Talon Playground!');
`,
    },
  ],
};

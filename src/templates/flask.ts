import type { Project } from '../types';

export const flaskTemplate: Project = {
  template: 'flask',
  entry: 'app.py',
  files: [
    {
      path: 'requirements.txt',
      content: `flask
`,
    },
    {
      path: 'README.md',
      content: `# Python Flask 模板

这是 **Python Flask** 模板，点击顶部 **Run** 按钮启动。

- 服务监听端口 5000，启动后可在右侧 Preview 中访问。
- 提供示例路由 \`GET /\` 和 \`GET /api/hello\`。
- 运行在 Talon Sandbox 云端容器中，无需本地安装任何依赖。
`,
    },
    {
      path: 'app.py',
      content: `from flask import Flask, jsonify
import datetime
import time

app = Flask(__name__)
START_TIME = time.time()


@app.route("/")
def index():
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello from Flask</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; }
    h1 { color: #7c3aed; }
    .endpoint { background: #faf5ff; border: 1px solid #c4b5fd; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
    code { background: #e5e7eb; padding: .2rem .4rem; border-radius: 3px; font-size: .9rem; }
  </style>
</head>
<body>
  <h1>Hello from Talon Sandbox (Flask)</h1>
  <p>Flask server is running on port 5000.</p>
  <div class="endpoint">
    <strong>GET /</strong> — this page
  </div>
  <div class="endpoint">
    <strong>GET /api/hello</strong> — returns <code>{"message": "hello", "timestamp": "..."}</code>
  </div>
</body>
</html>"""


@app.route("/api/hello")
def api_hello():
    return jsonify(
        message="hello",
        timestamp=datetime.datetime.utcnow().isoformat() + "Z",
        uptime=round(time.time() - START_TIME, 2),
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
`,
    },
  ],
};

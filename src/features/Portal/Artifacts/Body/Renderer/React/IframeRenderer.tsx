import { memo, useMemo } from 'react';

interface IframeRendererProps {
  code: string;
  title?: string;
}

const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

// Serialize code safely for embedding in an HTML <script> block:
// JSON.stringify handles all JS escaping; the unicode escapes prevent </script> injection.
const safeJsonStr = (s: string) =>
  JSON.stringify(s).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');

const buildIframeHTML = (code: string, title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="/artifact-deps/tailwind.cdn.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="/artifact-deps/react.production.min.js"></script>
  <script src="/artifact-deps/react-dom.production.min.js"></script>
  <script src="/artifact-deps/prop-types.min.js"></script> 
  <script src="/artifact-deps/babel.min.js"></script>
  <script src="/artifact-deps/recharts.min.js"></script>
  <script src="/artifact-deps/lucide-react.min.js"></script>
  <script src="/artifact-deps/artifact-runtime.js"></script>
  <script>
    (function () {
      var userCode = ${safeJsonStr(code)};
      try {
        var transformed = Babel.transform(userCode, {
          filename: 'App.tsx',
          presets: [
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }],
          ],
          plugins: ['transform-modules-commonjs'],
        }).code;

        var preamble = 'var React = require("react"); var ReactDOM = require("react-dom");\\n';

        var mod = { exports: {} };
        new Function('require', 'module', 'exports', preamble + transformed)(
          window.__artifactRequire,
          mod,
          mod.exports,
        );

        var Component = mod.exports['default'] || mod.exports;
        if (typeof Component !== 'function') {
          throw new Error(
            'No default export found. Use "export default function ComponentName() { ... }"',
          );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(
          React.createElement(Component),
        );
      } catch (e) {
        document.getElementById('root').innerHTML =
          '<div style="color:#dc2626;padding:20px;font-family:monospace;font-size:13px;' +
          'white-space:pre-wrap;background:#fef2f2;border-left:4px solid #dc2626;' +
          'margin:16px;border-radius:4px"><b>Render Error</b>\\n\\n' +
          String((e && e.message) || e) +
          '</div>';
      }
    })();
  </script>
</body>
</html>`;

const IframeRenderer = memo<IframeRendererProps>(({ code, title = 'Artifact' }) => {
  const html = useMemo(() => buildIframeHTML(code, title), [code, title]);

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={html}
      style={{ border: 'none', height: '100%', width: '100%' }}
      title={title}
    />
  );
});

export default IframeRenderer;

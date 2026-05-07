import { SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

import IframeRenderer from './IframeRenderer';
import { createTemplateFiles } from './template';

interface ReactRendererProps {
  code: string;
}

// Set NEXT_PUBLIC_ARTIFACT_RENDERER_MODE=iframe in .env to use the
// offline-capable iframe renderer (intranet / air-gapped deployments).
// Run `bun run download:artifact-deps` once to fetch the required static assets.
const useIframeRenderer = process.env.NEXT_PUBLIC_ARTIFACT_RENDERER_MODE === 'iframe';

const ReactRenderer = memo<ReactRendererProps>(({ code }) => {
  const title = useChatStore(chatPortalSelectors.artifactTitle);

  if (useIframeRenderer) {
    return <IframeRenderer code={code} title={title ?? undefined} />;
  }

  return (
    <SandpackProvider
      style={{ height: '100%' }}
      template="vite-react-ts"
      theme="auto"
      customSetup={{
        dependencies: {
          '@ant-design/icons': 'latest',
          '@lshay/ui': 'latest',
          '@radix-ui/react-alert-dialog': 'latest',
          '@radix-ui/react-dialog': 'latest',
          '@radix-ui/react-icons': 'latest',
          'antd': 'latest',
          'class-variance-authority': 'latest',
          'clsx': 'latest',
          'lucide-react': 'latest',
          'recharts': 'latest',
          'tailwind-merge': 'latest',
        },
      }}
      files={{
        'App.tsx': code,
        ...createTemplateFiles({ title }),
      }}
      options={{
        externalResources: ['https://cdn.tailwindcss.com'],
        visibleFiles: ['App.tsx'],
      }}
    >
      <SandpackLayout style={{ height: '100%' }}>
        <SandpackPreview style={{ height: '100%' }} />
      </SandpackLayout>
    </SandpackProvider>
  );
});

export default ReactRenderer;

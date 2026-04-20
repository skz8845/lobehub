import '../initialize';

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import BootErrorBoundary from '@/components/BootErrorBoundary';
import { createAppRouter } from '@/utils/router';

import { desktopRoutes } from './router/desktopRouter.config';

const basename = undefined;

const router = createAppRouter(desktopRoutes, { basename });

createRoot(document.getElementById('root')!).render(
  <BootErrorBoundary>
    <RouterProvider router={router} />
  </BootErrorBoundary>,
);

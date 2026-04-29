import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { threatIntelRuntime } from '@/server/services/toolExecution/serverRuntimes/threatIntel';

const queryIndicatorSchema = z.object({
  indicator: z.string().min(1),
  type: z.enum(['ip', 'domain', 'url', 'hash']).optional(),
});

const queryFileHashSchema = z.object({
  fileId: z.string().min(1),
  fileName: z.string().optional(),
});

export const threatIntelRouter = router({
  queryFileHash: authedProcedure
    .use(serverDatabase)
    .input(queryFileHashSchema)
    .mutation(async ({ input, ctx }) => {
      const runtime = threatIntelRuntime.factory({
        serverDB: ctx.serverDB,
        toolManifestMap: {},
        userId: ctx.userId,
      });
      return runtime.queryFileHash(input);
    }),

  queryIndicator: authedProcedure.input(queryIndicatorSchema).mutation(async ({ input }) => {
    const runtime = threatIntelRuntime.factory(undefined as any);
    return runtime.queryIndicator(input);
  }),
});

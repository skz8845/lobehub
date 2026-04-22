/**
 * CVE Analyzer TRPC Router
 *
 * Provides API endpoints for CVE vulnerability analysis tools.
 */
import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc/lambda';
import { cveAnalyzerRuntime } from '@/server/services/toolExecution/serverRuntimes/cveAnalyzer';

// Input schemas
// const getStatsSchema = z.object({
//   groupByYear: z.boolean().optional(),
//   product: z.string().optional(),
//   year: z.string().optional(),
// });

const lookupVulnerabilitySchema = z.object({
  ids: z.array(z.string()),
});

const searchVulnerabilitySchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});

export const cveAnalyzerRouter = router({
  /**
   * Get vulnerability count statistics
   */
  // getStats: authedProcedure.input(getStatsSchema).mutation(async ({ input }) => {
  //   const runtime = cveAnalyzerRuntime.factory();
  //   return runtime.getStats(input);
  // }),

  /**
   * Exact lookup of vulnerability by CVE or CNNVD ID
   */
  lookupVulnerability: authedProcedure
    .input(lookupVulnerabilitySchema)
    .mutation(async ({ input }) => {
      const runtime = cveAnalyzerRuntime.factory();
      return runtime.lookupVulnerability(input);
    }),

  /**
   * Semantic search for vulnerabilities using embedding + rerank
   */
  searchVulnerability: authedProcedure
    .input(searchVulnerabilitySchema)
    .mutation(async ({ input }) => {
      const runtime = cveAnalyzerRuntime.factory();
      return runtime.searchVulnerability(input);
    }),
});

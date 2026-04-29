import type { BuiltinToolManifest } from '@lobechat/types';

import { systemPrompt } from './systemRole';
import { ThreatIntelApiName, ThreatIntelIdentifier } from './types';

export const ThreatIntelManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Query threat intelligence for an IP address, domain, URL, or file hash (MD5/SHA1/SHA256). Returns matching attributes and related threat event context from the MISP platform. The indicator type is auto-detected.',
      name: ThreatIntelApiName.queryIndicator,
      parameters: {
        additionalProperties: false,
        properties: {
          indicator: {
            description:
              'The value to query — an IP address, domain name, URL, or file hash (MD5/SHA1/SHA256)',
            type: 'string',
          },
          type: {
            description:
              'Indicator type hint (ip, domain, url, hash). Auto-detected from the value if not provided.',
            enum: ['ip', 'domain', 'url', 'hash'],
            type: 'string',
          },
        },
        required: ['indicator'],
        type: 'object',
      },
    },
    {
      description:
        'Compute MD5, SHA1, and SHA256 hashes of an uploaded file attachment and query threat intelligence for all three hashes. Use this when a file is attached to the conversation and the user wants to check it for threats.',
      name: ThreatIntelApiName.queryFileHash,
      parameters: {
        additionalProperties: false,
        properties: {
          fileId: {
            description: 'The file ID of the uploaded attachment in the conversation',
            type: 'string',
          },
          fileName: {
            description: 'The file name (for display purposes)',
            type: 'string',
          },
        },
        required: ['fileId'],
        type: 'object',
      },
    },
  ],
  identifier: ThreatIntelIdentifier,
  meta: {
    avatar: '🔍',
    description: 'Query MISP threat intelligence for IPs, domains, URLs, and file hashes',
    title: 'Threat Intel',
  },
  systemRole: systemPrompt,
  type: 'builtin',
};

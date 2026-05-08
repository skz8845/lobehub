interface AgentOwnershipResult {
  error?: string;
  isOwnAgent: boolean | null;
}

interface CheckOwnershipParams {
  accessToken?: string;
  accountId?: string | number | null;
  enableMarketTrustedClient?: boolean;
  marketIdentifier?: string;
  skipCache?: boolean;
}

export const checkOwnership = async (_params: CheckOwnershipParams): Promise<boolean> => {
  return false;
};

export const useAgentOwnershipCheck = (_marketIdentifier?: string): AgentOwnershipResult => {
  return { isOwnAgent: false };
};

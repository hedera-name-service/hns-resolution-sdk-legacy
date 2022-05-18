export const CONFIRMATION_STATUS = 1;
export const EXIT_STATUS = -1;
export const HEDERA_SUCCESS = 22; // The transaction succeeded

export const MANAGER_TOPIC_ID = '0.0.47954429';

type Network = 'testnet' | 'mainnet' | 'lw_testnet' | 'lw_mainnet';
export const NETWORK: Network = 'testnet';
// export const NETWORK = 'mainnet';

export const HEDERA_TEST_URL = 'https://testnet.mirrornode.hedera.com/api/v1';
export const HEDERA_MAIN_URL = 'https://mainnet-public.mirrornode.hedera.com/api/v1';
export const LEDGERWORKS_TEST_URL = 'https://testnet.mirror.lworks.io/api/v1';
export const LEDGERWORKS_MAIN_URL = 'https://mainnet.mirror.lworks.io/api/v1';

export const API_MAX_LIMIT = 100;

export interface NameHash {
  domain: string;
  tldHash: Buffer;
  sldHash: Buffer;
}

export interface TLDTopicMessage {
  nameHash: {
    domain: string;
    tldHash: string;
    sldHash: string;
  };
  topicId: string;
  contractId: string;
  tokenId: string;
}

export interface SLDTopicMessage {
  transactionId: string;
  nameHash: {
    domain: string;
    tldHash: string;
    sldHash: string;
  };
  nftId: number;
  provider: string;
  providerData: {
    contractId: string;
  }
}

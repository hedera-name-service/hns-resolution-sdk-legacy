import { NFT } from './types/NFT';
import { NameHash } from './types/NameHash';
export type NetworkType = 'hedera_test' | 'hedera_main' | 'arkhia_test' | 'arkhia_main';
export declare enum NetworkBaseURL {
    'hedera_test' = "https://testnet.mirrornode.hedera.com",
    'hedera_main' = "https://mainnet-public.mirrornode.hedera.com",
    'arkhia_test' = "https://hedera.testnet.arkhia.io",
    'arkhia_main' = "https://hashport.arkhia.io/hedera/mainnet"
}
export declare const getBaseUrl: (networkType: NetworkType) => NetworkBaseURL;
export declare const MAX_PAGE_SIZE = 100;
export declare class MirrorNode {
    networkType: NetworkType;
    baseUrl: string;
    authKey: string;
    authHeader: string;
    constructor(networkType: NetworkType, authHeader?: string, authKey?: string);
    getNFT(tokenId: string, serial: string): Promise<NFT>;
    getNFTsByAccountId(tokenId: string, accountId: string): Promise<NFT[]>;
    getTopicMessage(nameHash: NameHash): Promise<any>;
    getContractEvmAddress(contractId: string): Promise<any>;
    getNftTopicMessages(topicMessages: string | any[], userNftLists: any[]): Promise<any[]>;
    getAllUserHNSNfts(topicMessages: string | any[], accountId: string): Promise<any[]>;
    getTldTopicMessage(): Promise<any>;
    private getBaseUrl;
    private buildAuthHeaders;
    private sendGetRequest;
    private nextApiCall;
    private nextApiCallTopics;
}

import { MirrorNode, NetworkType } from "./mirrorNode";
import { ICache, NameHash, ResolverOptions, SecondLevelDomain } from "./types";
export declare const TEST_TLD_TOPIC_ID = "0.0.48097305";
export declare const MAIN_TLD_TOPIC_ID = "0.0.1234189";
export { ICache, Links, MessageObject, MessagesResponse, NameHash, NFT, NFTsResponse, ResolverOptions, SecondLevelDomain, TopLevelDomain, } from "./types";
export declare class Resolver {
    mirrorNode: MirrorNode;
    private _options?;
    private _isCaughtUpWithTopic;
    private _subscriptions;
    private cache;
    private _unstoppableDomainsResolver;
    private jsonRPC;
    isCaughtUpPromise: Promise<unknown>;
    private IndexerApi;
    constructor(networkType: NetworkType, arkhiaUrl?: string, authHeader?: string, authKey?: string, jsonRPC?: string, cache?: ICache, resolverOptions?: ResolverOptions);
    /**
     * @description Initializes all topic subscriptions.
     */
    init(): void;
    dispose(): Promise<void>;
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    resolveSLD(domain: string): Promise<string | undefined>;
    getAllDomainsForAccount(accountId: string): Promise<string[]>;
    getDomainInfo(domainOrNameHashOrTxId: string | NameHash): Promise<any>;
    private getTldTopicId;
    /**
     * @description Retrieves and stores top level domains
     */
    private getTopLevelDomains;
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    private getTopLevelDomain;
    /**
     * @description Retrieves second level domains
     */
    private getSecondLevelDomains;
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<SecondLevelDomain>}
     */
    getSecondLevelDomain(nameHash: NameHash): Promise<SecondLevelDomain | undefined>;
    private getSldTopicMessage;
    private getEvmContractAddress;
    private getAccountInfo;
}

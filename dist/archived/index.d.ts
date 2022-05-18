import { AccountId } from '@hashgraph/sdk';
import { NameHash, TLDTopicMessage } from './config/constants.config';
export declare class HashgraphNames {
    tldMessages: TLDTopicMessage[];
    constructor();
    /**
   * @description Queries the Manager Topic for all TLD messages and stores them
   */
    populateTLDMessages: () => Promise<void>;
    /**
   * @description Generate a NameHash of the provided domain string
   * @param domain: {string} The domain string to hash
   * @returns {Buffer}
   */
    static generateNameHash: (domain: string) => NameHash;
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    private queryTLDTopicMessage;
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
     * the manager topic will be queried first to get the topic for the namehash
     * @returns {Promise<SLDTopicMessage>}
     */
    private getSLDTopicMessageByHash;
    /**
     * @description Resolve the owner of a domain by REST queries
     * @param nameHash: {NameHash} The domain to query
     * @returns {Promise<AccountId>}
     */
    private resolveDomainByRestQuery;
    /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
    resolveSLD: (domain: string) => Promise<AccountId>;
}

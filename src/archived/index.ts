import {
  AccountId,
  TokenId,
  TopicId,
} from '@hashgraph/sdk';
import keccak256 from 'keccak256';
import {
  API_MAX_LIMIT,
  NameHash,
  SLDTopicMessage,
  TLDTopicMessage,
} from './config/constants.config';
import {
  queryNFTOwner,
  querySLDTopicMessages,
  queryTLDTopicMessages,
} from './contract.utils';

export class HashgraphNames {
  tldMessages: TLDTopicMessage[];

  constructor() {
    this.tldMessages = [];
    this.populateTLDMessages();
  }

  /**
 * @description Queries the Manager Topic for all TLD messages and stores them
 */
  populateTLDMessages = async () => {
    this.tldMessages = await queryTLDTopicMessages();
  };

  /**
 * @description Generate a NameHash of the provided domain string
 * @param domain: {string} The domain string to hash
 * @returns {Buffer}
 */
  static generateNameHash = (domain: string): NameHash => {
    if (!domain) {
      return {
        domain,
        tldHash: Buffer.from([0x0]),
        sldHash: Buffer.from([0x0]),
      };
    }
    const domainsList = domain.split('.').reverse();
    const tld = domainsList[0];
    let sld;
    if (domainsList.length > 1) {
      sld = domainsList.slice(0, 2);
    }

    let tldHash = Buffer.from([0x0]);
    let sldHash = Buffer.from([0x0]);

    if (tld) {
      tldHash = keccak256(tld);
    }
    if (sld) {
      sldHash = sld.reduce(
        (prev, curr) => keccak256(prev + curr),
        Buffer.from(''),
      );
    }

    return { domain, tldHash, sldHash };
  };

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private queryTLDTopicMessage = async (nameHash: NameHash): Promise<TLDTopicMessage> => {
    try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = this.tldMessages.find((message: any) => (message.nameHash.tldHash === nameHash.tldHash.toString('hex')));
      if (!found) throw new Error('Not Found');

      return found;
    } catch (err) {
    // eslint-disable-next-line no-console
      console.log(err);
      throw new Error('Failed to getMessageByRestQuery');
    }
  };

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @param inputTopicId: {TopicId | null} The topic id to use for the query. If none is provided,
   * the manager topic will be queried first to get the topic for the namehash
   * @returns {Promise<SLDTopicMessage>}
   */
  private getSLDTopicMessageByHash = async (
    nameHash: NameHash,
    inputTopicId: TopicId | null = null,
  ): Promise<SLDTopicMessage> => {
    try {
      let topicId;
      if (!inputTopicId) {
        const tldTopicMessage = await this.queryTLDTopicMessage(nameHash);
        topicId = TopicId.fromString(tldTopicMessage.topicId);
      } else {
        topicId = inputTopicId;
      }

      let topicMessagesResult;
      let sequenceNumber = 1;
      let found;
      do {
        // eslint-disable-next-line no-await-in-loop
        topicMessagesResult = await querySLDTopicMessages(topicId, sequenceNumber);
        sequenceNumber += topicMessagesResult.length;
        const sldTopicMessages = topicMessagesResult as SLDTopicMessage [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        found = sldTopicMessages.filter((message: any) => (message.nameHash.sldHash === nameHash.sldHash.toString('hex')));
        if (found.length) break;
      } while (topicMessagesResult.length === API_MAX_LIMIT);

      if (!found.length) throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${topicId.toString()}]`);
      const message = found.reduce(
        (prev: SLDTopicMessage, curr: SLDTopicMessage) => (prev.nftId > curr.nftId ? prev : curr),
      );
      return message;
    } catch (err) {
    // eslint-disable-next-line no-console
      console.log(err);
      throw new Error('Failed to getMessageByRestQuery');
    }
  };

  /**
   * @description Resolve the owner of a domain by REST queries
   * @param nameHash: {NameHash} The domain to query
   * @returns {Promise<AccountId>}
   */
  private resolveDomainByRestQuery = async (
    nameHash: NameHash,
  ): Promise<AccountId> => {
    try {
      const tldTopicMessage = await this.queryTLDTopicMessage(nameHash);
      const tokenId = TokenId.fromString(tldTopicMessage.tokenId);
      const topicId = TopicId.fromString(tldTopicMessage.topicId);

      const message = await this.getSLDTopicMessageByHash(nameHash, topicId);
      const accountId = await queryNFTOwner(message.nftId, tokenId);

      return accountId;
    } catch (err) {
    // eslint-disable-next-line no-console
      console.log(err);
      throw new Error('Failed to resolveDomainByRestQuery');
    }
  };

  /**
 * @description Resolves a Second Level Domain to the wallet address of the domain's owner
 * @param domain: {string} The domain to query
 * @returns {Promise<AccountId>}
 */
  resolveSLD = async (
    domain: string,
  ): Promise<AccountId> => {
    try {
      const nameHash = HashgraphNames.generateNameHash(domain);
      return await this.resolveDomainByRestQuery(nameHash);
    } catch (err) {
    // eslint-disable-next-line no-console
      console.log(err);
      throw new Error('Failed to resolveSLD');
    }
  };
}

import { AccountId, TokenId, TopicId } from '@hashgraph/sdk';
import { SLDTopicMessage, TLDTopicMessage } from './config/constants.config';
/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<TLDTopicMessage []>}
 */
export declare const queryTLDTopicMessages: () => Promise<TLDTopicMessage[]>;
/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<SLDTopicMessage []>}
 */
export declare const querySLDTopicMessages: (topicId: TopicId, sequenceNumber: number) => Promise<SLDTopicMessage[]>;
/**
 * @description Issues a Rest API request to get the NFT Info
 * @returns {Promise<AccountId>}
 */
export declare const queryNFTOwner: (serial: number, tokenId: TokenId) => Promise<AccountId>;

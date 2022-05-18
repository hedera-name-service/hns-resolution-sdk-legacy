import { AccountId, TokenId, TopicId } from '@hashgraph/sdk';
import axios from 'axios';
import {
  API_MAX_LIMIT,
  HEDERA_MAIN_URL,
  HEDERA_TEST_URL,
  LEDGERWORKS_MAIN_URL,
  LEDGERWORKS_TEST_URL,
  MANAGER_TOPIC_ID,
  NETWORK,
  SLDTopicMessage,
  TLDTopicMessage,
} from './config/constants.config';

/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<TLDTopicMessage []>}
 */
export const queryTLDTopicMessages = async (): Promise<TLDTopicMessage []> => {
  try {
    let url;
    switch (NETWORK) {
      case 'testnet':
        // eslint-disable-next-line max-len
        url = `${HEDERA_TEST_URL}/topics/${MANAGER_TOPIC_ID}/messages/?limit=${API_MAX_LIMIT}`;
        break;
      case 'mainnet':
        // eslint-disable-next-line max-len
        url = `${HEDERA_MAIN_URL}/topics/${MANAGER_TOPIC_ID}/messages/?limit=${API_MAX_LIMIT}`;
        break;
      case 'lw_testnet':
        // eslint-disable-next-line max-len
        url = `${LEDGERWORKS_TEST_URL}/topics/${MANAGER_TOPIC_ID}/messages/?limit=${API_MAX_LIMIT}`;
        break;
      case 'lw_mainnet':
        // eslint-disable-next-line max-len
        url = `${LEDGERWORKS_MAIN_URL}/topics/${MANAGER_TOPIC_ID}/messages/?limit=${API_MAX_LIMIT}`;
        break;
      default:
        throw new Error('Invalid Network');
    }

    const config = {
      method: 'get',
      url,
    };

    const res = await axios(config);
    const { messages } = res.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicMessages: TLDTopicMessage[] = messages.map((x: any) => {
      const decoded = Buffer.from(x.message, 'base64').toString();
      return JSON.parse(decoded) as TLDTopicMessage;
    });

    return topicMessages;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    throw new Error('Failed to get Topic Messages');
  }
};

/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<SLDTopicMessage []>}
 */
export const querySLDTopicMessages = async (
  topicId: TopicId,
  sequenceNumber: number,
): Promise<SLDTopicMessage []> => {
  try {
    let url;
    switch (NETWORK) {
      case 'testnet':
        // eslint-disable-next-line max-len
        url = `${HEDERA_TEST_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${API_MAX_LIMIT}`;
        break;
      case 'mainnet':
        // eslint-disable-next-line max-len
        url = `${HEDERA_MAIN_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${API_MAX_LIMIT}`;
        break;
      case 'lw_testnet':
        // eslint-disable-next-line max-len
        url = `${LEDGERWORKS_TEST_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${API_MAX_LIMIT}`;
        break;
      case 'lw_mainnet':
        // eslint-disable-next-line max-len
        url = `${LEDGERWORKS_MAIN_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${API_MAX_LIMIT}`;
        break;
      default:
        throw new Error('Invalid Network');
    }

    const config = {
      method: 'get',
      url,
    };

    const res = await axios(config);
    const { messages } = res.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicMessages = messages.map((x: any) => {
      const decoded = Buffer.from(x.message, 'base64').toString();
      return JSON.parse(decoded) as SLDTopicMessage;
    });

    return topicMessages;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    throw new Error('Failed to get Topic Messages');
  }
};

/**
 * @description Issues a Rest API request to get the NFT Info
 * @returns {Promise<AccountId>}
 */
export const queryNFTOwner = async (
  serial: number,
  tokenId: TokenId,
): Promise<AccountId> => {
  try {
    let url;
    switch (NETWORK) {
      case 'testnet':
        url = `${HEDERA_TEST_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
        break;
      case 'mainnet':
        url = `${HEDERA_MAIN_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
        break;
      case 'lw_testnet':
        url = `${LEDGERWORKS_TEST_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
        break;
      case 'lw_mainnet':
        url = `${LEDGERWORKS_MAIN_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
        break;

      default:
        throw new Error('Invalid Network');
    }

    const config = {
      method: 'get',
      url,
    };

    const res = await axios(config);
    const accountId = res.data.account_id;

    return AccountId.fromString(accountId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    throw new Error('Failed to get nft info');
  }
};

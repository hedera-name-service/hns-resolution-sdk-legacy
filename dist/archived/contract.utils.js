"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryNFTOwner = exports.querySLDTopicMessages = exports.queryTLDTopicMessages = void 0;
const sdk_1 = require("@hashgraph/sdk");
const axios_1 = __importDefault(require("axios"));
const constants_config_1 = require("./config/constants.config");
/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<TLDTopicMessage []>}
 */
const queryTLDTopicMessages = async () => {
    try {
        let url;
        switch (constants_config_1.NETWORK) {
            case 'testnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.HEDERA_TEST_URL}/topics/${constants_config_1.MANAGER_TOPIC_ID}/messages/?limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'mainnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.HEDERA_MAIN_URL}/topics/${constants_config_1.MANAGER_TOPIC_ID}/messages/?limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'lw_testnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.LEDGERWORKS_TEST_URL}/topics/${constants_config_1.MANAGER_TOPIC_ID}/messages/?limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'lw_mainnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.LEDGERWORKS_MAIN_URL}/topics/${constants_config_1.MANAGER_TOPIC_ID}/messages/?limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            default:
                throw new Error('Invalid Network');
        }
        const config = {
            method: 'get',
            url,
        };
        const res = await (0, axios_1.default)(config);
        const { messages } = res.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topicMessages = messages.map((x) => {
            const decoded = Buffer.from(x.message, 'base64').toString();
            return JSON.parse(decoded);
        });
        return topicMessages;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        throw new Error('Failed to get Topic Messages');
    }
};
exports.queryTLDTopicMessages = queryTLDTopicMessages;
/**
 * @description Issues a Rest API request to get the TLD topic messages
 * @returns {Promise<SLDTopicMessage []>}
 */
const querySLDTopicMessages = async (topicId, sequenceNumber) => {
    try {
        let url;
        switch (constants_config_1.NETWORK) {
            case 'testnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.HEDERA_TEST_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'mainnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.HEDERA_MAIN_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'lw_testnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.LEDGERWORKS_TEST_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            case 'lw_mainnet':
                // eslint-disable-next-line max-len
                url = `${constants_config_1.LEDGERWORKS_MAIN_URL}/topics/${topicId}/messages/?sequenceNumber=gte:${sequenceNumber}&limit=${constants_config_1.API_MAX_LIMIT}`;
                break;
            default:
                throw new Error('Invalid Network');
        }
        const config = {
            method: 'get',
            url,
        };
        const res = await (0, axios_1.default)(config);
        const { messages } = res.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const topicMessages = messages.map((x) => {
            const decoded = Buffer.from(x.message, 'base64').toString();
            return JSON.parse(decoded);
        });
        return topicMessages;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        throw new Error('Failed to get Topic Messages');
    }
};
exports.querySLDTopicMessages = querySLDTopicMessages;
/**
 * @description Issues a Rest API request to get the NFT Info
 * @returns {Promise<AccountId>}
 */
const queryNFTOwner = async (serial, tokenId) => {
    try {
        let url;
        switch (constants_config_1.NETWORK) {
            case 'testnet':
                url = `${constants_config_1.HEDERA_TEST_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
                break;
            case 'mainnet':
                url = `${constants_config_1.HEDERA_MAIN_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
                break;
            case 'lw_testnet':
                url = `${constants_config_1.LEDGERWORKS_TEST_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
                break;
            case 'lw_mainnet':
                url = `${constants_config_1.LEDGERWORKS_MAIN_URL}/tokens/${tokenId.toString()}/nfts/${serial}`;
                break;
            default:
                throw new Error('Invalid Network');
        }
        const config = {
            method: 'get',
            url,
        };
        const res = await (0, axios_1.default)(config);
        const accountId = res.data.account_id;
        return sdk_1.AccountId.fromString(accountId);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        throw new Error('Failed to get nft info');
    }
};
exports.queryNFTOwner = queryNFTOwner;

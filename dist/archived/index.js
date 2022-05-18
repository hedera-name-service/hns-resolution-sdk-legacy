"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashgraphNames = void 0;
const sdk_1 = require("@hashgraph/sdk");
const keccak256_1 = __importDefault(require("keccak256"));
const constants_config_1 = require("./config/constants.config");
const contract_utils_1 = require("./contract.utils");
class HashgraphNames {
    constructor() {
        /**
       * @description Queries the Manager Topic for all TLD messages and stores them
       */
        this.populateTLDMessages = async () => {
            this.tldMessages = await (0, contract_utils_1.queryTLDTopicMessages)();
        };
        /**
         * @description Get the tld message on the Manager topic for a given nameHash
         * @param nameHash: {NameHash} The nameHash for the sld to query
         * @returns {Promise<TLDTopicMessage>}
         */
        this.queryTLDTopicMessage = async (nameHash) => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const found = this.tldMessages.find((message) => (message.nameHash.tldHash === nameHash.tldHash.toString('hex')));
                if (!found)
                    throw new Error('Not Found');
                return found;
            }
            catch (err) {
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
        this.getSLDTopicMessageByHash = async (nameHash, inputTopicId = null) => {
            try {
                let topicId;
                if (!inputTopicId) {
                    const tldTopicMessage = await this.queryTLDTopicMessage(nameHash);
                    topicId = sdk_1.TopicId.fromString(tldTopicMessage.topicId);
                }
                else {
                    topicId = inputTopicId;
                }
                let topicMessagesResult;
                let sequenceNumber = 1;
                let found;
                do {
                    // eslint-disable-next-line no-await-in-loop
                    topicMessagesResult = await (0, contract_utils_1.querySLDTopicMessages)(topicId, sequenceNumber);
                    sequenceNumber += topicMessagesResult.length;
                    const sldTopicMessages = topicMessagesResult;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    found = sldTopicMessages.filter((message) => (message.nameHash.sldHash === nameHash.sldHash.toString('hex')));
                    if (found.length)
                        break;
                } while (topicMessagesResult.length === constants_config_1.API_MAX_LIMIT);
                if (!found.length)
                    throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${topicId.toString()}]`);
                const message = found.reduce((prev, curr) => (prev.nftId > curr.nftId ? prev : curr));
                return message;
            }
            catch (err) {
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
        this.resolveDomainByRestQuery = async (nameHash) => {
            try {
                const tldTopicMessage = await this.queryTLDTopicMessage(nameHash);
                const tokenId = sdk_1.TokenId.fromString(tldTopicMessage.tokenId);
                const topicId = sdk_1.TopicId.fromString(tldTopicMessage.topicId);
                const message = await this.getSLDTopicMessageByHash(nameHash, topicId);
                const accountId = await (0, contract_utils_1.queryNFTOwner)(message.nftId, tokenId);
                return accountId;
            }
            catch (err) {
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
        this.resolveSLD = async (domain) => {
            try {
                const nameHash = HashgraphNames.generateNameHash(domain);
                return await this.resolveDomainByRestQuery(nameHash);
            }
            catch (err) {
                // eslint-disable-next-line no-console
                console.log(err);
                throw new Error('Failed to resolveSLD');
            }
        };
        this.tldMessages = [];
        this.populateTLDMessages();
    }
}
exports.HashgraphNames = HashgraphNames;
/**
* @description Generate a NameHash of the provided domain string
* @param domain: {string} The domain string to hash
* @returns {Buffer}
*/
HashgraphNames.generateNameHash = (domain) => {
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
        tldHash = (0, keccak256_1.default)(tld);
    }
    if (sld) {
        sldHash = sld.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from(''));
    }
    return { domain, tldHash, sldHash };
};

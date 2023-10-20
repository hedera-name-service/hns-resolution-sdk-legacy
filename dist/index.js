"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = exports.MAIN_TLD_TOPIC_ID = exports.TEST_TLD_TOPIC_ID = void 0;
/* eslint-disable no-await-in-loop */
const resolution_1 = __importDefault(require("@unstoppabledomains/resolution"));
const axios_1 = __importDefault(require("axios"));
const hashDomain_1 = require("./hashDomain");
const MemoryCache_1 = require("./MemoryCache");
const mirrorNode_1 = require("./mirrorNode");
const pollingTopicSubscriber_1 = require("./topicSubscriber/pollingTopicSubscriber");
const archived_1 = require("./archived");
const getSmartContractService_1 = require("./smartContracts/getSmartContractService");
const util_1 = require("./util/util");
const IndexerAPI_1 = require("./indexer/IndexerAPI");
const notFoundError_1 = require("./errorHandles/notFoundError");
const tooManyRequest_1 = require("./errorHandles/tooManyRequest");
const indexer_1 = require("./types/indexer");
exports.TEST_TLD_TOPIC_ID = '0.0.48097305';
exports.MAIN_TLD_TOPIC_ID = '0.0.1234189';
class Resolver {
    constructor(networkType, authHeader = '', authKey = '', jsonRPC = '', cache, resolverOptions) {
        this._isCaughtUpWithTopic = new Map();
        this._subscriptions = [];
        this.isCaughtUpPromise = Promise.resolve();
        this.mirrorNode = new mirrorNode_1.MirrorNode(networkType, authHeader, authKey);
        if (!cache) {
            this.cache = new MemoryCache_1.MemoryCache();
        }
        else {
            this.cache = cache;
        }
        this.jsonRPC = ((authHeader && authKey && jsonRPC) || jsonRPC) ? jsonRPC : 'https://mainnet.hashio.io/api';
        if (resolverOptions) {
            this._options = resolverOptions;
        }
        this.IndexerApi = new IndexerAPI_1.Indexer(networkType);
    }
    /**
     * @description Initializes all topic subscriptions.
     */
    init() {
        this._unstoppableDomainsResolver = new resolution_1.default();
        this.isCaughtUpPromise = this.getTopLevelDomains().then(async () => {
            const promises = [];
            await this.cache.getTlds().then((knownTlds) => {
                if (knownTlds) {
                    for (const tld of knownTlds) {
                        const sldsCaughtUpPromise = this.getSecondLevelDomains(tld.topicId);
                        promises.push(sldsCaughtUpPromise);
                    }
                }
            });
            await Promise.all(promises);
        });
    }
    async dispose() {
        await Promise.all(this._subscriptions.map((unsub) => unsub()));
    }
    /**
     * @description Resolves a Second Level Domain to the wallet address of the domain's owner
     * @param domain: {string} The domain to query
     * @returns {Promise<AccountId>}
     */
    async resolveSLD(domain) {
        var _a;
        // TODO - Adding isUnstoppableDomain
        // Indexer API
        let isIndexerOnline = true;
        try {
            const res = await this.IndexerApi.getDomainInfo(domain);
            const d = new Date(0);
            d.setUTCSeconds(res.data.expiration);
            return new Date() < d ? res.data.account_id : '';
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                switch ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) {
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        isIndexerOnline = false;
                        break;
                    case 429:
                        throw new tooManyRequest_1.TooManyRequests('Too Many Request');
                    case 404:
                        throw new notFoundError_1.NotFoundError('Domain Doesn\'t Exist');
                    default:
                        throw new Error('Something went wrong!');
                }
            }
        }
        // Old Logic
        if (isIndexerOnline === false) {
            const nameHash = (0, hashDomain_1.hashDomain)(domain);
            const domainTopicMessage = await this.getSldTopicMessage(nameHash);
            const contractEVM = await this.getEvmContractAddress(domainTopicMessage.contractId);
            const tldContractService = await (0, getSmartContractService_1.getTldSmartContract)(contractEVM, this.jsonRPC);
            const contractList = await tldContractService.getNodes();
            if (contractList.length === 0)
                throw Error('No Contract Address');
            const { foundData, nftInfo } = await this.getAccountInfo(contractList, nameHash, domainTopicMessage.tokenId);
            return Promise.resolve(foundData && new Date() < foundData.date ? nftInfo.account_id : '');
        }
        throw new Error('Unable to Find At This Point Of Time');
    }
    async getAllDomainsForAccount(accountId, options) {
        var _a;
        if (!accountId.startsWith('0.0.'))
            throw new Error('Invalid Account Id');
        if (options) {
            const checkOptions = options.filter((key) => !indexer_1.FilterParamKeys.includes(key));
            if (checkOptions.length !== 0)
                throw new Error(`Invalid Options: ${checkOptions}`);
        }
        let isIndexerOnline = true;
        try {
            const { data } = await this.IndexerApi.getAllDomainsInWallet(accountId);
            const filteredNames = data.filter((domainInfo) => domainInfo !== null).map((domainInfo) => {
                if (options) {
                    const res = { domain: domainInfo.domain };
                    options.forEach((e) => res[e] = domainInfo[e]);
                    return res;
                }
                return domainInfo.domain;
            });
            return filteredNames;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                switch ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) {
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        isIndexerOnline = false;
                        break;
                    case 429:
                        throw new tooManyRequest_1.TooManyRequests('Too Many Request');
                    default:
                        throw new Error('Something went wrong!');
                }
            }
        }
        if (isIndexerOnline === false) {
            const topicMessages = await this.mirrorNode.getTldTopicMessage();
            const userNftLists = await this.mirrorNode.getAllUserHNSNfts(topicMessages, accountId);
            const nftDataTopicMessages = await this.mirrorNode.getNftTopicMessages(topicMessages, userNftLists);
            const final = [];
            for (let index = 0; index < nftDataTopicMessages.length; index += 1) {
                const currMsgInfo = JSON.parse(Buffer.from(nftDataTopicMessages[index].message, 'base64').toString());
                const checkAccountId = await this.resolveSLD(currMsgInfo.nameHash.domain);
                if (checkAccountId === accountId && Boolean(checkAccountId)) {
                    final.push(currMsgInfo.nameHash.domain);
                }
            }
            return final;
        }
        throw new Error('Something went wrong!');
    }
    async getDomainInfo(domainOrNameHashOrTxId) {
        var _a;
        let nameHash;
        if (typeof domainOrNameHashOrTxId === 'string' && domainOrNameHashOrTxId.match(/[0-9].[0-9].[0-9]{1,7}@[0-9]{1,10}.[0-9]{1,9}/)) {
            const parseTxId = (0, util_1.formatHederaTxId)(domainOrNameHashOrTxId);
            const domainName = await this.mirrorNode.getTxInfo(parseTxId);
            nameHash = archived_1.HashgraphNames.generateNameHash(domainName.newDomain || domainName.extendedDomain || domainName.expiredDomain);
        }
        else if (typeof domainOrNameHashOrTxId === 'string' && domainOrNameHashOrTxId.match(/\.[hbar]|\.[boo]|\.[cream]/)) {
            nameHash = archived_1.HashgraphNames.generateNameHash(domainOrNameHashOrTxId);
        }
        else if (typeof domainOrNameHashOrTxId === 'object' && (0, util_1.isNameHash)(domainOrNameHashOrTxId)) {
            nameHash = domainOrNameHashOrTxId;
        }
        else {
            throw new Error('Invalid Input');
        }
        let isIndexerOnline = true;
        try {
            const res = await this.IndexerApi.getDomainInfo(nameHash.domain);
            const d = new Date(0);
            d.setUTCSeconds(res.data.expiration);
            const metadata = {
                transactionId: res.data.paymenttransaction_id.split('@')[1],
                nameHash: {
                    domain: res.data.domain,
                    tldHash: res.data.tld_hash,
                    sldHash: res.data.sld_hash,
                },
                nftId: `${res.data.token_id}:${res.data.nft_id}`,
                expiration: new Date() < d ? res.data.expiration * 1000 : null,
                provider: res.data.provider,
                providerData: {
                    contractId: res.data.contract_id,
                },
                accountId: new Date() < d ? res.data.account_id : '',
            };
            return metadata;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                switch ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) {
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        isIndexerOnline = false;
                        break;
                    case 429:
                        throw new tooManyRequest_1.TooManyRequests('Too Many Request');
                    case 404:
                        throw new notFoundError_1.NotFoundError('Domain Doesn\'t Exist');
                    default:
                        throw new Error('Something went wrong!');
                }
            }
        }
        if (isIndexerOnline === false) {
            const domainTopicMessage = await this.getSldTopicMessage(nameHash);
            const contractEVM = await this.getEvmContractAddress(domainTopicMessage.contractId);
            const tldContractService = await (0, getSmartContractService_1.getTldSmartContract)(contractEVM, this.jsonRPC);
            const contractList = await tldContractService.getNodes();
            if (contractList.length === 0)
                throw Error('No Contract Address');
            const { foundData, nftInfo } = await this.getAccountInfo(contractList, nameHash, domainTopicMessage.tokenId);
            const nftDataTopicMessage = await this.mirrorNode.getNftInfoTopicMessage(domainTopicMessage.topicId, nftInfo);
            if (nftDataTopicMessage.length === 0)
                throw new Error('Unable to Find MetaData');
            const final = JSON.parse(Buffer.from(nftDataTopicMessage[0].message, 'base64').toString());
            final.accountId = (!foundData || new Date() < foundData.date) ? nftInfo.account_id : '';
            final.expiration = (!foundData || new Date() < foundData.date) ? foundData === null || foundData === void 0 ? void 0 : foundData.date.getTime() : null;
            return final;
        }
        throw new Error('Something went wrong!');
    }
    // Private
    getTldTopicId() {
        if (this.mirrorNode.networkType.includes('test'))
            return exports.TEST_TLD_TOPIC_ID;
        return exports.MAIN_TLD_TOPIC_ID;
    }
    /**
     * @description Retrieves and stores top level domains
     */
    async getTopLevelDomains() {
        await new Promise((resolve) => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, this.getTldTopicId(), (messageObj) => {
                const decoded = Buffer.from(messageObj.message, 'base64').toString();
                const tld = JSON.parse(decoded);
                // always set the cache to the latest tld on the topic
                this.cache.setTld(tld.nameHash.tldHash, tld);
            }, () => {
                this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
                resolve();
            }, undefined, this.mirrorNode.authKey, this.mirrorNode.authHeader, this._options));
        });
    }
    /**
     * @description Get the tld message on the Manager topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<TLDTopicMessage>}
     */
    async getTopLevelDomain(nameHash) {
        while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const tldHash = nameHash.tldHash.toString('hex');
        const found = this.cache.hasTld(tldHash);
        if (!found)
            throw new Error('TLD not found');
        return this.cache.getTld(tldHash);
    }
    /**
     * @description Retrieves second level domains
     */
    async getSecondLevelDomains(topicId) {
        await new Promise((resolve) => {
            this._subscriptions.push(pollingTopicSubscriber_1.PollingTopicSubscriber.subscribe(this.mirrorNode.networkType, topicId, async (messageObj) => {
                const decoded = Buffer.from(messageObj.message, 'base64').toString();
                const sld = JSON.parse(decoded);
                if (messageObj.sequence_number) {
                    sld.sequenceNumber = messageObj.sequence_number;
                }
                const { tldHash } = sld.nameHash;
                const { sldHash } = sld.nameHash;
                if (await this.cache.hasTld(tldHash)) {
                    const cachedSld = await Promise.resolve(this.cache.getSld(tldHash, sldHash));
                    // TODO: replace if the one in cache is expired
                    if (!cachedSld) {
                        this.cache.setSld(tldHash, sld);
                    }
                }
                else {
                    this.cache.setSld(tldHash, sld);
                }
            }, () => {
                this._isCaughtUpWithTopic.set(topicId, true);
                resolve();
            }, undefined, this.mirrorNode.authKey, this.mirrorNode.authHeader, this._options));
        });
    }
    /**
     * @description Get the sld message on the TLD topic for a given nameHash
     * @param nameHash: {NameHash} The nameHash for the sld to query
     * @returns {Promise<SecondLevelDomain>}
     */
    // Improve method to look for unexpired domains
    async getSecondLevelDomain(nameHash) {
        const tld = await this.getTopLevelDomain(nameHash);
        if (!tld)
            return undefined;
        const tldHash = nameHash.tldHash.toString('hex');
        const sldHash = nameHash.sldHash.toString('hex');
        let isCaughtUp = false;
        while (!isCaughtUp) {
            isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId);
            if (await this.cache.hasSld(tldHash, sldHash)) {
                return this.cache.getSld(tldHash, sldHash);
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        throw new Error(`SLD message for:[${nameHash.domain}] not found on topic:[${tld.topicId.toString()}]`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getSldTopicMessage(nameHash) {
        const sldTopicMsg = await this.mirrorNode.getTopicMessage(nameHash);
        return sldTopicMsg;
    }
    async getEvmContractAddress(contractId) {
        const evmAddress = this.mirrorNode.getContractEvmAddress(contractId);
        return evmAddress;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAccountInfo(contractList, nameHash, tokenId) {
        let foundData;
        if (contractList.length === 0)
            throw Error('Evm Contract Issues');
        for (let index = 0; index < contractList.length; index += 1) {
            const SLDcontracts = (0, getSmartContractService_1.getSldSmartContract)(contractList[index], this.jsonRPC);
            const serial = await SLDcontracts.getSerial(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
            const dateExp = await SLDcontracts.getExpiry(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
            if (dateExp !== 0) {
                const d = new Date(0);
                d.setUTCSeconds(dateExp);
                foundData = { serial, date: d };
                break;
            }
        }
        if (!foundData)
            throw Error('No Serial');
        const nftInfo = await this.mirrorNode.getNFT(tokenId, `${foundData === null || foundData === void 0 ? void 0 : foundData.serial}`);
        return { foundData, nftInfo };
    }
}
exports.Resolver = Resolver;

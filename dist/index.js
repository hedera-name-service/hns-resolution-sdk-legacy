"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resolver = exports.MAIN_TLD_TOPIC_ID = exports.TEST_TLD_TOPIC_ID = void 0;
/* eslint-disable no-await-in-loop */
const resolution_1 = __importDefault(require("@unstoppabledomains/resolution"));
const hashDomain_1 = require("./hashDomain");
const MemoryCache_1 = require("./MemoryCache");
const mirrorNode_1 = require("./mirrorNode");
const pollingTopicSubscriber_1 = require("./topicSubscriber/pollingTopicSubscriber");
const getSmartContractService_1 = require("./smartContracts/getSmartContractService");
exports.TEST_TLD_TOPIC_ID = '0.0.48097305';
exports.MAIN_TLD_TOPIC_ID = '0.0.1234189';
class Resolver {
    constructor(networkType, authHeader = '', authKey = '', cache, resolverOptions) {
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
        if (resolverOptions) {
            this._options = resolverOptions;
        }
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
        // const isUnstoppableDomain = await this._unstoppableDomainsResolver?.isSupportedDomain(domain);
        // if (isUnstoppableDomain) return await this._unstoppableDomainsResolver?.addr(domain, 'HBAR');
        const nameHash = (0, hashDomain_1.hashDomain)(domain);
        const domainTopicMessage = await this.getSldTopicMessage(nameHash);
        const contractEVM = await this.getEvmContractAddress(domainTopicMessage.contractId);
        const tldContractService = await (0, getSmartContractService_1.getTldSmartContract)(contractEVM);
        const contractList = await tldContractService.getNodes();
        const accountId = this.getAccountId(contractList, nameHash, domainTopicMessage.tokenId);
        return Promise.resolve(accountId);
        // const sld = await this.getSecondLevelDomain(nameHash);
        // if (sld) {
        //   const [tokenId, serial] = sld.nftId.split(':');
        //   const nft = await this.mirrorNode.getNFT(tokenId, serial);
        //   return nft.account_id;
        // }
        // return Promise.resolve(undefined);
    }
    async getAllDomainsForAccount(accountId) {
        // let accountId = accountIdOrDomain;
        // if (!accountIdOrDomain.startsWith('0.0.')) {
        //   const accountIdFromDomain = await this.resolveSLD(accountIdOrDomain);
        //   if (accountIdFromDomain) {
        //     accountId = accountIdFromDomain;
        //   } else {
        //     return [];
        //   }
        // }
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
        // const tokenIds = await this.cache.getTokenIds();
        // if (tokenIds.length === 0) {
        //   return [];
        // }
        // const nftInfos = await Promise.all(tokenIds.map((tokenId) => this.mirrorNode.getNFTsByAccountId(tokenId, accountId)));
        // const slds = await Promise.all(nftInfos
        //   .flat()
        //   .map((o) => this.cache.getSldByNftId(`${o.token_id}:${o.serial_number}`)));
        // return (slds.filter((sld) => sld !== undefined) as SecondLevelDomain[]).map((sld) => sld.nameHash.domain);
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
    async getAccountId(contractList, nameHash, tokenId) {
        let foundData;
        for (let index = 0; index < contractList.length; index += 1) {
            const SLDcontracts = (0, getSmartContractService_1.getSldSmartContract)(contractList[index]);
            const serial = await SLDcontracts.getSerial(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
            const dateExp = await SLDcontracts.getExpiry(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
            if (dateExp !== 0) {
                const d = new Date(0);
                d.setUTCSeconds(dateExp);
                foundData = { serial, date: d };
                break;
            }
        }
        if (foundData && new Date() < foundData.date) {
            const info = await this.mirrorNode.getNFT(tokenId, `${foundData === null || foundData === void 0 ? void 0 : foundData.serial}`);
            return info.account_id;
        }
        return '';
    }
}
exports.Resolver = Resolver;

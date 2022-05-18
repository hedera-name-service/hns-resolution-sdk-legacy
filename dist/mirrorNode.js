"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MirrorNode = exports.MAX_PAGE_SIZE = exports.getBaseUrl = exports.NetworkBaseURL = void 0;
const axios_1 = __importDefault(require("axios"));
const _1 = require(".");
const DOMAINS = ['hbar', 'boo', 'cream'];
var NetworkBaseURL;
(function (NetworkBaseURL) {
    NetworkBaseURL["hedera_test"] = "https://testnet.mirrornode.hedera.com";
    NetworkBaseURL["hedera_main"] = "https://mainnet-public.mirrornode.hedera.com";
    //   'lworks_test' = 'https://testnet.mirror.lworks.io',
    //   'lworks_main' = 'https://mainnet.mirror.lworks.io',
    NetworkBaseURL["arkhia_test"] = "https://hedera.testnet.arkhia.io";
    NetworkBaseURL["arkhia_main"] = "https://hashport.arkhia.io/hedera/mainnet";
})(NetworkBaseURL = exports.NetworkBaseURL || (exports.NetworkBaseURL = {}));
const getBaseUrl = (networkType) => {
    switch (networkType) {
        case 'hedera_test':
            return NetworkBaseURL.hedera_test;
        case 'hedera_main':
            return NetworkBaseURL.hedera_main;
        // case 'lworks_test':
        //   return NetworkBaseURL.lworks_test;
        // case 'lworks_main':
        //   return NetworkBaseURL.lworks_main;
        case 'arkhia_test':
            return NetworkBaseURL.arkhia_test;
        case 'arkhia_main':
            return NetworkBaseURL.arkhia_main;
        default:
            throw new Error('No base URL available for NetworkType');
    }
};
exports.getBaseUrl = getBaseUrl;
// Max page size allowed by hedera nodes
exports.MAX_PAGE_SIZE = 100;
class MirrorNode {
    constructor(networkType, authHeader = '', authKey = '') {
        this.networkType = networkType;
        this.baseUrl = this.getBaseUrl();
        this.authHeader = authHeader;
        this.authKey = authKey;
    }
    async getNFT(tokenId, serial) {
        const url = `${this.getBaseUrl()}/api/v1/tokens/${tokenId}/nfts/${serial}`;
        const res = await this.sendGetRequest(url);
        return res.data;
    }
    async getNFTsByAccountId(tokenId, accountId) {
        const url = `${this.getBaseUrl()}/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}&limit=100`;
        let res = await this.sendGetRequest(url);
        const { nfts } = res.data;
        while (res.data.links.next) {
            const nextUrl = `${this.getBaseUrl()}${res.data.links.next}`;
            // eslint-disable-next-line no-await-in-loop
            res = await this.sendGetRequest(nextUrl);
            const nextNfts = res.data.nfts;
            nfts.push(...nextNfts);
        }
        return nfts;
    }
    async getTopicMessage(nameHash) {
        const urlTopicManger = `${this.getBaseUrl()}/api/v1/topics/${_1.MAIN_TLD_TOPIC_ID}/messages`;
        const res = await this.sendGetRequest(urlTopicManger);
        const { messages } = res.data;
        const topicMessages = messages.map((x) => {
            const decoded = Buffer.from(x.message, 'base64').toString();
            return JSON.parse(decoded);
        });
        const found = topicMessages.find((message) => message.nameHash.tldHash === nameHash.tldHash.toString('hex'));
        return found;
    }
    async getContractEvmAddress(contractId) {
        const url = `${this.getBaseUrl()}/api/v1/contracts/${contractId}`;
        const res = await this.sendGetRequest(url);
        return res.data.evm_address;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getNftTopicMessages(topicMessages, userNftLists) {
        const nftDataMessages = [];
        for (let index = 0; index < topicMessages.length; index += 1) {
            const urlTopicManger = `${this.getBaseUrl()}/api/v1/topics/${topicMessages[index].topicId}/messages`;
            // eslint-disable-next-line no-await-in-loop
            const mainTopicMessages = await this.sendGetRequest(urlTopicManger);
            const filteredData = mainTopicMessages.data.messages.filter((x) => {
                const currMsgInfo = JSON.parse(Buffer.from(x.message, 'base64').toString());
                return userNftLists.some((y) => currMsgInfo.nftId === `${y.token_id}:${y.serial_number}`);
            });
            nftDataMessages.push(...filteredData);
            if (mainTopicMessages.data.links.next) {
                // eslint-disable-next-line no-await-in-loop
                const nextCall = await this.nextApiCallTopics(mainTopicMessages.data.links.next);
                const nextData = nextCall.filter((x) => {
                    const currMsgInfo = JSON.parse(Buffer.from(x.message, 'base64').toString());
                    return userNftLists.some((y) => currMsgInfo.nftId === `${y.token_id}:${y.serial_number}`);
                });
                nftDataMessages.push(...nextData);
            }
            if (nftDataMessages.length === userNftLists.length)
                break;
        }
        return nftDataMessages;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAllUserHNSNfts(topicMessages, accountId) {
        const nftList = [];
        for (let index = 0; index < topicMessages.length; index += 1) {
            const nftEndpoint = `${this.getBaseUrl()}/api/v1/tokens/${topicMessages[index].tokenId}/nfts?account.id=${accountId}`;
            // eslint-disable-next-line no-await-in-loop
            const nftData = await this.sendGetRequest(nftEndpoint);
            nftList.push(...nftData.data.nfts);
            if (nftData.data.links.next !== null) {
                // eslint-disable-next-line no-await-in-loop
                const nextCall = await this.nextApiCall(nftData.data.links.next);
                nftList.push(...nextCall.nfts);
            }
        }
        return nftList;
    }
    async getTldTopicMessage() {
        const urlTopicManger = `${this.getBaseUrl()}/api/v1/topics/${_1.MAIN_TLD_TOPIC_ID}/messages`;
        const res = await this.sendGetRequest(urlTopicManger);
        const { messages } = res.data;
        const topicMessages = messages.map((x) => {
            const decoded = Buffer.from(x.message, 'base64').toString();
            return JSON.parse(decoded);
        }).filter((x) => DOMAINS.find((y) => y === x.nameHash.domain));
        return topicMessages;
    }
    // Private
    getBaseUrl() {
        return (0, exports.getBaseUrl)(this.networkType);
    }
    // eslint-disable-next-line class-methods-use-this
    buildAuthHeaders(authKey, authVal) {
        if (authVal && authKey) {
            return { [authKey]: authVal };
        }
        return {};
    }
    async sendGetRequest(url) {
        const AUTH_HEADERS = this.buildAuthHeaders(this.authHeader, this.authKey);
        try {
            const res = this.networkType === 'arkhia_main' ? await axios_1.default.get(url, { headers: { ...AUTH_HEADERS } }) : await axios_1.default.get(url);
            return res;
        }
        catch (err) {
            throw new Error('Get Request Failed');
        }
    }
    async nextApiCall(url) {
        const nextUrl = `${this.getBaseUrl()}${url}`;
        const nextData = await this.sendGetRequest(nextUrl);
        if (nextData.data.links.next !== null) {
            return nextData.data.concat(await this.nextApiCall(nextData.data.links.next));
        }
        return nextData.data;
    }
    async nextApiCallTopics(url) {
        const nextUrl = `${this.getBaseUrl()}${url}`;
        const nextData = await this.sendGetRequest(nextUrl);
        if (nextData.data.links.next !== null) {
            return nextData.data.messages.concat(await this.nextApiCallTopics(nextData.data.links.next));
        }
        return nextData.data.messages;
    }
}
exports.MirrorNode = MirrorNode;

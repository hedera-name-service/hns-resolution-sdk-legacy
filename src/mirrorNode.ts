import axios, { AxiosResponse } from "axios";
import { MAIN_TLD_TOPIC_ID } from ".";
import { HashgraphNames } from "./archived";
import { NameHash } from "./types/NameHash";
import { NFT } from "./types/NFT";

const DOMAINS = [`hbar`, `boo`, `cream`];

export type NetworkType = `hedera_test` | `hedera_main` | `arkhia_test` | `arkhia_main`;

export enum NetworkBaseURL {
  hedera_test = `https://testnet.mirrornode.hedera.com`,
  hedera_main = `https://mainnet-public.mirrornode.hedera.com`,
  arkhia_test = `https://hedera.testnet.arkhia.io`,
  arkhia_main = `https://hashport.arkhia.io/hedera/mainnet`,
}

export const getBaseUrl = (networkType: NetworkType) => {
  switch (networkType) {
    case `hedera_test`:
      return NetworkBaseURL.hedera_test;
    case `hedera_main`:
      return NetworkBaseURL.hedera_main;
    case `arkhia_test`:
      return NetworkBaseURL.arkhia_test;
    case `arkhia_main`:
      return NetworkBaseURL.arkhia_main;
    default:
      throw new Error(`No base URL available for NetworkType`);
  }
};

// Max page size allowed by hedera nodes
export const MAX_PAGE_SIZE = 100;

export class MirrorNode {
  networkType: NetworkType;
  baseUrl: string;
  authKey: string;
  authHeader: string;

  constructor(networkType: NetworkType, authHeader = ``, authKey = ``, url?: string) {
    this.networkType = networkType;
    this.baseUrl = url ? url : this.getBaseUrl();
    this.authHeader = authHeader;
    this.authKey = authKey;
  }

  async getNFT(tokenId: string, serial: string): Promise<NFT> {
    const url = `${this.baseUrl}/api/v1/tokens/${tokenId}/nfts/${serial}`;
    const res = await this.sendGetRequest(url);
    return res.data as NFT;
  }

  async getNFTsByAccountId(tokenId: string, accountId: string): Promise<NFT[]> {
    const url = `${this.baseUrl}/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}&limit=100`;
    let res = await this.sendGetRequest(url);
    const { nfts } = res.data;
    while (res.data.links.next) {
      const nextUrl = `${this.baseUrl}${res.data.links.next}`;
      // eslint-disable-next-line no-await-in-loop
      res = await this.sendGetRequest(nextUrl);
      const nextNfts: NFT[] = res.data.nfts;
      nfts.push(...nextNfts);
    }
    return nfts;
  }
  async getTopicMessage(nameHash: NameHash) {
    const urlTopicManger = `${this.baseUrl}/api/v1/topics/${MAIN_TLD_TOPIC_ID}/messages`;
    const res = await this.sendGetRequest(urlTopicManger);
    const { messages } = res.data;
    const topicMessages = messages.map(
      (x: {
        message: WithImplicitCoercion<string> | { [Symbol.toPrimitive](hint: `string`): string };
      }) => {
        const decoded = Buffer.from(x.message, `base64`).toString();
        return JSON.parse(decoded);
      },
    );
    const found = topicMessages.find(
      (message: { nameHash: { tldHash: string } }) =>
        message.nameHash.tldHash === nameHash.tldHash.toString(`hex`),
    );
    return found;
  }

  async getTxInfo(txId: string) {
    const urlTopicManger = `${this.baseUrl}/api/v1/transactions/${txId}`;
    const res = await this.sendGetRequest(urlTopicManger);
    const domainName = JSON.parse(
      Buffer.from(res.data.transactions[0].memo_base64, `base64`).toString(),
    );
    return domainName;
  }

  async getContractEvmAddress(contractId: string) {
    const url = `${this.baseUrl}/api/v1/contracts/${contractId}`;
    const res = await this.sendGetRequest(url);

    return res.data.evm_address;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getNftTopicMessages(topicMessages: string | any[], userNftLists: any[]) {
    const nftDataMessages = [];
    for (let index = 0; index < topicMessages.length; index += 1) {
      const urlTopicManger = `${this.baseUrl}/api/v1/topics/${topicMessages[index].topicId}/messages`;
      // eslint-disable-next-line no-await-in-loop
      const mainTopicMessages = await this.sendGetRequest(urlTopicManger);
      const filteredData = mainTopicMessages.data.messages.filter((x) => {
        const currMsgInfo = JSON.parse(Buffer.from(x.message, `base64`).toString());
        return userNftLists.some((y) => currMsgInfo.nftId === `${y.token_id}:${y.serial_number}`);
      });
      nftDataMessages.push(...filteredData);

      if (mainTopicMessages.data.links.next) {
        // eslint-disable-next-line no-await-in-loop
        const nextCall = await this.nextApiCallTopics(mainTopicMessages.data.links.next);

        const nextData = nextCall.filter((x) => {
          const currMsgInfo = JSON.parse(Buffer.from(x.message, `base64`).toString());
          return userNftLists.some((y) => currMsgInfo.nftId === `${y.token_id}:${y.serial_number}`);
        });
        nftDataMessages.push(...nextData);
      }
      if (nftDataMessages.length === userNftLists.length) break;
    }
    return nftDataMessages;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getNftInfoTopicMessage(topicMessages: string, nftInfo: any) {
    let nftDataMessage;

    const urlTopicManger = `${this.baseUrl}/api/v1/topics/${topicMessages}/messages`;
    // eslint-disable-next-line no-await-in-loop
    const mainTopicMessages = await this.sendGetRequest(urlTopicManger);
    const filteredData = mainTopicMessages.data.messages.filter((x) => {
      const currMsgInfo = JSON.parse(Buffer.from(x.message, `base64`).toString());
      return currMsgInfo.nftId === `${nftInfo.token_id}:${nftInfo.serial_number}`;
    });
    nftDataMessage = filteredData;
    if (mainTopicMessages.data.links.next) {
      // eslint-disable-next-line no-await-in-loop
      const nextCall = await this.nextApiCallTopics(mainTopicMessages.data.links.next);

      const nextData = nextCall.filter((x) => {
        const currMsgInfo = JSON.parse(Buffer.from(x.message, `base64`).toString());
        return currMsgInfo.nftId === `${nftInfo.token_id}:${nftInfo.serial_number}`;
      });
      nftDataMessage = nextData;
    }

    return nftDataMessage;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllUserHNSNfts(topicMessages: string | any[], accountId: string) {
    const nftList = [];
    for (let index = 0; index < topicMessages.length; index += 1) {
      const nftEndpoint = `${this.baseUrl}/api/v1/tokens/${topicMessages[index].tokenId}/nfts?account.id=${accountId}`;
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
    const urlTopicManger = `${this.baseUrl}/api/v1/topics/${MAIN_TLD_TOPIC_ID}/messages`;
    const res = await this.sendGetRequest(urlTopicManger);
    const { messages } = res.data;
    const topicMessages = messages
      .map((x) => {
        const decoded = Buffer.from(x.message, `base64`).toString();
        return JSON.parse(decoded);
      })
      .filter((x) => DOMAINS.find((y) => y === x.nameHash.domain));
    return topicMessages;
  }

  // Private

  private getBaseUrl() {
    return getBaseUrl(this.networkType);
  }

  // eslint-disable-next-line class-methods-use-this
  private buildAuthHeaders(authKey: string, authVal: string) {
    if (authVal && authKey) {
      return { [authKey]: authVal };
    }
    return {};
  }

  private async sendGetRequest(url: string): Promise<AxiosResponse> {
    const AUTH_HEADERS = this.buildAuthHeaders(this.authHeader, this.authKey);

    try {
      const res =
        this.networkType === `arkhia_main`
          ? await axios.get(url, { headers: { ...AUTH_HEADERS } })
          : await axios.get(url);

      return res;
    } catch (err) {
      throw new Error(`Get Request Failed`);
    }
  }

  private async nextApiCall(url: string): Promise<AxiosResponse> {
    const nextUrl = `${this.baseUrl}${url}`;
    const nextData = await this.sendGetRequest(nextUrl);

    if (nextData.data.links.next !== null) {
      return nextData.data.concat(await this.nextApiCall(nextData.data.links.next));
    }
    return nextData.data;
  }

  private async nextApiCallTopics(url: string): Promise<AxiosResponse> {
    const nextUrl = `${this.baseUrl}${url}`;
    const nextData = await this.sendGetRequest(nextUrl);

    if (nextData.data.links.next !== null) {
      return nextData.data.messages.concat(await this.nextApiCallTopics(nextData.data.links.next));
    }
    return nextData.data.messages;
  }
}

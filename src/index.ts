/* eslint-disable no-await-in-loop */
import unstoppableDomainsResolution from '@unstoppabledomains/resolution';
import { ContractInfoQuery } from '@hashgraph/sdk/lib/exports';
import { fromString } from '@hashgraph/sdk/lib/EntityIdHelper';
import { hashDomain } from './hashDomain';
import { MemoryCache } from './MemoryCache';
import { MirrorNode, NetworkType } from './mirrorNode';
import { PollingTopicSubscriber } from './topicSubscriber/pollingTopicSubscriber';
import { ICache, NameHash, ResolverOptions, SecondLevelDomain, TopLevelDomain } from './types';
import { HashgraphNames } from './archived';
import { client } from './helpers/hashgraphSdkClient';
import { getSldSmartContract, getTldSmartContract } from './smartContracts/getSmartContractService';
import { formatHederaTxId, isNameHash } from './util/util';

export const TEST_TLD_TOPIC_ID = '0.0.48097305';
export const MAIN_TLD_TOPIC_ID = '0.0.1234189';

export {
  ICache,
  Links,
  MessageObject,
  MessagesResponse,
  NFT,
  NFTsResponse,
  NameHash,
  SecondLevelDomain,
  TopLevelDomain,
  ResolverOptions,
} from './types';

export class Resolver {
  mirrorNode: MirrorNode;
  private _options?: ResolverOptions;
  private _isCaughtUpWithTopic = new Map<string, boolean>();
  private _subscriptions: (() => void)[] = [];
  private cache: ICache;
  private _unstoppableDomainsResolver: any;
  private jsonRPC: string;
  isCaughtUpPromise: Promise<unknown> = Promise.resolve();

  constructor(networkType: NetworkType, authHeader = '', authKey = '', jsonRPC = '', cache?: ICache, resolverOptions?: ResolverOptions) {
    this.mirrorNode = new MirrorNode(networkType, authHeader, authKey);
    if (!cache) {
      this.cache = new MemoryCache();
    } else {
      this.cache = cache;
    }
    this.jsonRPC = ((authHeader && authKey && jsonRPC) || jsonRPC) ? jsonRPC : 'https://mainnet.hashio.io/api';
    if (resolverOptions) {
      this._options = resolverOptions;
    }
  }

  /**
   * @description Initializes all topic subscriptions.
   */
  public init() {
    this._unstoppableDomainsResolver = new unstoppableDomainsResolution();
    this.isCaughtUpPromise = this.getTopLevelDomains().then(async () => {
      const promises: Promise<void>[] = [];

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

  public async dispose() {
    await Promise.all(this._subscriptions.map((unsub) => unsub()));
  }

  /**
   * @description Resolves a Second Level Domain to the wallet address of the domain's owner
   * @param domain: {string} The domain to query
   * @returns {Promise<AccountId>}
   */
  public async resolveSLD(domain: string): Promise<string | undefined> {
    // const isUnstoppableDomain = await this._unstoppableDomainsResolver?.isSupportedDomain(domain);
    // if (isUnstoppableDomain) return await this._unstoppableDomainsResolver?.addr(domain, 'HBAR');

    const nameHash = hashDomain(domain);
    const domainTopicMessage = await this.getSldTopicMessage(nameHash);
    const contractEVM = await this.getEvmContractAddress(domainTopicMessage.contractId);
    const tldContractService = await getTldSmartContract(contractEVM, this.jsonRPC);
    const contractList = await tldContractService.getNodes();
    if (contractList.length === 0) throw Error('No Contract Address');
    const { foundData, nftInfo } = await this.getAccountInfo(contractList, nameHash, domainTopicMessage.tokenId);

    return Promise.resolve(foundData && new Date() < foundData.date ? nftInfo.account_id : '');
    // const sld = await this.getSecondLevelDomain(nameHash);
    // if (sld) {
    //   const [tokenId, serial] = sld.nftId.split(':');
    //   const nft = await this.mirrorNode.getNFT(tokenId, serial);
    //   return nft.account_id;
    // }
    // return Promise.resolve(undefined);
  }

  public async getAllDomainsForAccount(accountId: string): Promise<string[]> {
    // let accountId = accountIdOrDomain;
    // if (!accountIdOrDomain.startsWith('0.0.')) {
    //   const accountIdFromDomain = await this.resolveSLD(accountIdOrDomain);
    //   if (accountIdFromDomain) {
    //     accountId = accountIdFromDomain;
    //   } else {
    //     return [];
    //   }
    // }
    if (!accountId.startsWith('0.0.')) return [];
    const topicMessages = await this.mirrorNode.getTldTopicMessage();
    const userNftLists = await this.mirrorNode.getAllUserHNSNfts(topicMessages, accountId);
    const nftDataTopicMessages = await this.mirrorNode.getNftTopicMessages(topicMessages, userNftLists);
    const final = [];
    for (let index = 0; index < nftDataTopicMessages.length; index += 1) {
      const currMsgInfo = JSON.parse(Buffer.from(nftDataTopicMessages[index].message, 'base64').toString());
      const checkAccountId = await this.resolveSLD(currMsgInfo.nameHash.domain);
      if (checkAccountId === accountId && Boolean(checkAccountId)) { final.push(currMsgInfo.nameHash.domain); }
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

  public async getDomainInfo(domainOrNameHashOrTxId: string | NameHash) {
    let nameHash: NameHash;
    if (typeof domainOrNameHashOrTxId === 'string' && domainOrNameHashOrTxId.match(/[0-9].[0-9].[0-9]{1,7}@[0-9]{1,10}.[0-9]{1,9}/)) {
      const parseTxId = formatHederaTxId(domainOrNameHashOrTxId);
      const domainName = await this.mirrorNode.getTxInfo(parseTxId);
      nameHash = HashgraphNames.generateNameHash(domainName.newDomain || domainName.extendedDomain || domainName.expiredDomain);
    } else if (typeof domainOrNameHashOrTxId === 'string' && domainOrNameHashOrTxId.match(/\.[hbar]|\.[boo]|\.[cream]/)) {
      nameHash = HashgraphNames.generateNameHash(domainOrNameHashOrTxId);
    } else if (typeof domainOrNameHashOrTxId === 'object' && isNameHash(domainOrNameHashOrTxId)) {
      nameHash = domainOrNameHashOrTxId;
    } else {
      throw new Error('Invalid Input');
    }

    const domainTopicMessage = await this.getSldTopicMessage(nameHash);
    const contractEVM = await this.getEvmContractAddress(domainTopicMessage.contractId);
    const tldContractService = await getTldSmartContract(contractEVM, this.jsonRPC);
    const contractList = await tldContractService.getNodes();
    if (contractList.length === 0) throw Error('No Contract Address');
    const { foundData, nftInfo } = await this.getAccountInfo(contractList, nameHash, domainTopicMessage.tokenId);

    const nftDataTopicMessage = await this.mirrorNode.getNftInfoTopicMessage(domainTopicMessage.topicId, nftInfo);
    if (nftDataTopicMessage.length === 0) throw new Error('Unable to Find MetaData');
    const final = JSON.parse(Buffer.from(nftDataTopicMessage[0].message, 'base64').toString());

    final.accountId = (!foundData || new Date() < foundData.date) ? nftInfo.account_id : '';
    final.expiration = (!foundData || new Date() < foundData.date) ? foundData?.date.getTime() : null;
    return final;
  }

  // Private

  private getTldTopicId(): string {
    if (this.mirrorNode.networkType.includes('test')) return TEST_TLD_TOPIC_ID;
    return MAIN_TLD_TOPIC_ID;
  }

  /**
   * @description Retrieves and stores top level domains
   */
  private async getTopLevelDomains(): Promise<void> {
    await new Promise<void>((resolve) => {
      this._subscriptions.push(
        PollingTopicSubscriber.subscribe(
          this.mirrorNode.networkType,
          this.getTldTopicId(),
          (messageObj) => {
            const decoded = Buffer.from(
              messageObj.message,
              'base64',
            ).toString();
            const tld = JSON.parse(decoded) as TopLevelDomain;

            // always set the cache to the latest tld on the topic
            this.cache.setTld(tld.nameHash.tldHash, tld);
          },
          () => {
            this._isCaughtUpWithTopic.set(this.getTldTopicId(), true);
            resolve();
          },
          undefined,
          this.mirrorNode.authKey,
          this.mirrorNode.authHeader,
          this._options,
        ),
      );
    });
  }

  /**
   * @description Get the tld message on the Manager topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<TLDTopicMessage>}
   */
  private async getTopLevelDomain(
    nameHash: NameHash,
  ): Promise<TopLevelDomain | undefined> {
    while (!this._isCaughtUpWithTopic.get(this.getTldTopicId())) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const tldHash = nameHash.tldHash.toString('hex');
    const found = this.cache.hasTld(tldHash);
    if (!found) throw new Error('TLD not found');

    return this.cache.getTld(tldHash)!;
  }

  /**
   * @description Retrieves second level domains
   */
  private async getSecondLevelDomains(topicId: string): Promise<void> {
    await new Promise<void>((resolve) => {
      this._subscriptions.push(
        PollingTopicSubscriber.subscribe(
          this.mirrorNode.networkType,
          topicId,
          async (messageObj) => {
            const decoded = Buffer.from(
              messageObj.message,
              'base64',
            ).toString();
            const sld = JSON.parse(decoded) as SecondLevelDomain;

            if (messageObj.sequence_number) {
              sld.sequenceNumber = messageObj.sequence_number;
            }

            const { tldHash } = sld.nameHash;
            const { sldHash } = sld.nameHash;
            if (await this.cache.hasTld(tldHash)) {
              const cachedSld = await Promise.resolve(
                this.cache.getSld(tldHash, sldHash)!,
              );
              // TODO: replace if the one in cache is expired
              if (!cachedSld) {
                this.cache.setSld(tldHash, sld);
              }
            } else {
              this.cache.setSld(tldHash, sld);
            }
          },
          () => {
            this._isCaughtUpWithTopic.set(topicId, true);
            resolve();
          },
          undefined,
          this.mirrorNode.authKey,
          this.mirrorNode.authHeader,
          this._options,
        ),
      );
    });
  }

  /**
   * @description Get the sld message on the TLD topic for a given nameHash
   * @param nameHash: {NameHash} The nameHash for the sld to query
   * @returns {Promise<SecondLevelDomain>}
   */

  // Improve method to look for unexpired domains
  public async getSecondLevelDomain(
    nameHash: NameHash,
  ): Promise<SecondLevelDomain | undefined> {
    const tld = await this.getTopLevelDomain(nameHash);
    if (!tld) return undefined;
    const tldHash = nameHash.tldHash.toString('hex');
    const sldHash = nameHash.sldHash.toString('hex');

    let isCaughtUp = false;
    while (!isCaughtUp) {
      isCaughtUp = this._isCaughtUpWithTopic.get(tld.topicId)!;
      if (await this.cache.hasSld(tldHash, sldHash)) {
        return this.cache.getSld(tldHash, sldHash)!;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(
      `SLD message for:[${nameHash.domain
      }] not found on topic:[${tld.topicId.toString()}]`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getSldTopicMessage(nameHash:NameHash) {
    const sldTopicMsg = await this.mirrorNode.getTopicMessage(nameHash);
    return sldTopicMsg;
  }

  private async getEvmContractAddress(contractId:string) {
    const evmAddress = this.mirrorNode.getContractEvmAddress(contractId);
    return evmAddress;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getAccountInfo(contractList:string[], nameHash: NameHash, tokenId: string) {
    let foundData;
    console.log(contractList);
    if (contractList.length === 0) throw Error('Evm Contract Issues');

    for (let index = 0; index < contractList.length; index += 1) {
      const SLDcontracts = getSldSmartContract(contractList[index], this.jsonRPC);
      const serial = await SLDcontracts.getSerial(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
      const dateExp = await SLDcontracts.getExpiry(`0x${Buffer.from(nameHash.sldHash).toString('hex')}`);
      if (dateExp !== 0) {
        const d = new Date(0);
        d.setUTCSeconds(dateExp);
        foundData = { serial, date: d };
        break;
      }
    }
    console.log(foundData);
    if (!foundData) throw Error('No Serial');

    const nftInfo = await this.mirrorNode.getNFT(tokenId, `${foundData?.serial}`);

    return { foundData, nftInfo };
  }
}

import { ICache } from "./types/Cache";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";

export class MemoryCache implements ICache {
  tld: Map<string, TopLevelDomain>;
  slds: Map<string, Map<string, SecondLevelDomain>>;
  nftIdToNameHash: Map<string, {
    domain: string;
    tldHash: string;
    sldHash: string;
  }>;

  constructor() {
    this.tld = new Map<string, TopLevelDomain>();
    this.slds = new Map<string, Map<string, SecondLevelDomain>>();
    this.nftIdToNameHash = new Map<string, {
      domain: string;
      tldHash: string;
      sldHash: string;
    }>();
  }

  getTld(
    tldHash: string
  ):Promise<TopLevelDomain | undefined> {
    return Promise.resolve(this.tld.get(tldHash));
  }

  getTlds(): Promise<TopLevelDomain[]> {
    return Promise.resolve(Array.from(this.tld.values()) || []);
  }

  async getTokenIds(): Promise<string[]> {
    const tokenIds = new Set<string>();

    // Grab tokenids from TLDs
    const tlds = await this.getTlds();
    tlds.forEach(tld => {
      tokenIds.add(tld.tokenId);
    });

    // Grab tokenids from SLDs because the TLDs is not an exhaustive list of token ids
    for (const sldMap of this.slds.values()) {
      for (const sld of sldMap.values()) {
        const tid = sld.nftId.split(':')[0];
        tokenIds.add(tid);
      }
    }

    return Array.from(tokenIds);
  }

  getSld(
    tldHash: string,
    sldHash: string
  ): Promise<SecondLevelDomain | undefined> {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return Promise.resolve(sldCache.get(sldHash));
      }
    }
    return Promise.resolve(undefined);
  }

  getSldByNftId(nftId: string): Promise<SecondLevelDomain | undefined> {
    const nameHash = this.nftIdToNameHash.get(nftId);
    if (!nameHash) {
      return Promise.resolve(undefined);
    }

    return this.getSld(nameHash.tldHash, nameHash.sldHash);
  }

  setTld(tldHash: string, tld: TopLevelDomain): Promise<void> {
    this.tld.set(tldHash, tld);
    return Promise.resolve();
  }

  setSld(tldHash: string, sld: SecondLevelDomain): Promise<void> {
    if (this.slds.has(tldHash)) {
      const sldDomainCache = this.slds.get(tldHash)!;
      if (!sldDomainCache.has(sld.nameHash.sldHash)) {
        sldDomainCache.set(sld.nameHash.sldHash, sld);
      }
    } else {
      this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
    }
    this.nftIdToNameHash.set(sld.nftId, sld.nameHash);
    return Promise.resolve();
  }

  hasTld(key: string): Promise<boolean> {
    return Promise.resolve(this.tld.has(key));
  }

  hasSld(tldHash: string, sldHash: string): Promise<boolean> {
    if (this.slds.has(tldHash)) {
      const sldCache = this.slds.get(tldHash);
      if (sldCache) {
        return Promise.resolve(sldCache.has(sldHash));
      }
    }
    return Promise.resolve(false);
  }
}

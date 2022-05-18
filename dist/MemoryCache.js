"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
class MemoryCache {
    constructor() {
        this.tld = new Map();
        this.slds = new Map();
        this.nftIdToNameHash = new Map();
    }
    getTld(tldHash) {
        return Promise.resolve(this.tld.get(tldHash));
    }
    getTlds() {
        return Promise.resolve(Array.from(this.tld.values()) || []);
    }
    async getTokenIds() {
        const tokenIds = new Set();
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
    getSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return Promise.resolve(sldCache.get(sldHash));
            }
        }
        return Promise.resolve(undefined);
    }
    getSldByNftId(nftId) {
        const nameHash = this.nftIdToNameHash.get(nftId);
        if (!nameHash) {
            return Promise.resolve(undefined);
        }
        return this.getSld(nameHash.tldHash, nameHash.sldHash);
    }
    setTld(tldHash, tld) {
        this.tld.set(tldHash, tld);
        return Promise.resolve();
    }
    setSld(tldHash, sld) {
        if (this.slds.has(tldHash)) {
            const sldDomainCache = this.slds.get(tldHash);
            if (!sldDomainCache.has(sld.nameHash.sldHash)) {
                sldDomainCache.set(sld.nameHash.sldHash, sld);
            }
        }
        else {
            this.slds.set(tldHash, new Map([[sld.nameHash.sldHash, sld]]));
        }
        this.nftIdToNameHash.set(sld.nftId, sld.nameHash);
        return Promise.resolve();
    }
    hasTld(key) {
        return Promise.resolve(this.tld.has(key));
    }
    hasSld(tldHash, sldHash) {
        if (this.slds.has(tldHash)) {
            const sldCache = this.slds.get(tldHash);
            if (sldCache) {
                return Promise.resolve(sldCache.has(sldHash));
            }
        }
        return Promise.resolve(false);
    }
}
exports.MemoryCache = MemoryCache;

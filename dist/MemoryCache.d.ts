import { ICache } from "./types/Cache";
import { SecondLevelDomain } from "./types/SecondLevelDomain";
import { TopLevelDomain } from "./types/TopLevelDomain";
export declare class MemoryCache implements ICache {
    tld: Map<string, TopLevelDomain>;
    slds: Map<string, Map<string, SecondLevelDomain>>;
    nftIdToNameHash: Map<string, {
        domain: string;
        tldHash: string;
        sldHash: string;
    }>;
    constructor();
    getTld(tldHash: string): Promise<TopLevelDomain | undefined>;
    getTlds(): Promise<TopLevelDomain[]>;
    getTokenIds(): Promise<string[]>;
    getSld(tldHash: string, sldHash: string): Promise<SecondLevelDomain | undefined>;
    getSldByNftId(nftId: string): Promise<SecondLevelDomain | undefined>;
    setTld(tldHash: string, tld: TopLevelDomain): Promise<void>;
    setSld(tldHash: string, sld: SecondLevelDomain): Promise<void>;
    hasTld(key: string): Promise<boolean>;
    hasSld(tldHash: string, sldHash: string): Promise<boolean>;
}

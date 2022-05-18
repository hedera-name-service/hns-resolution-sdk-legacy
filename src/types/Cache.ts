import { SecondLevelDomain } from "./SecondLevelDomain";
import { TopLevelDomain } from "./TopLevelDomain";

export interface ICache {
  getTld(tldHash: string): Promise<TopLevelDomain | undefined>;
  getTlds(): Promise<TopLevelDomain[] | undefined>;
  getSld(
    tldHash: string,
    sldHash: string
  ): Promise<SecondLevelDomain | undefined>;
  getTokenIds(): Promise<string[]>;
  getSldByNftId(nftId: string): Promise<SecondLevelDomain | undefined>;
  setTld(tldHash: string, tld: TopLevelDomain): Promise<void>;
  setSld(tldHash: string, sld: SecondLevelDomain): Promise<void>;
  hasTld(tldHash: string): Promise<boolean>;
  hasSld(tldHash: string, sldHash: string): Promise<boolean>;
}

import { AxiosResponse } from 'axios';
import { DomainInfo } from './types/indexer';
export declare class Indexer {
    url: string;
    constructor(network: string);
    getDomainInfo(sld: string): Promise<AxiosResponse<DomainInfo>>;
}

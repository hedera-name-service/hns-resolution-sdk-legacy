import axios, { AxiosResponse } from 'axios';
import { DOMAIN_EP_MAIN, DOMAIN_EP_TEST } from './routesApi';
import { DomainInfo } from '../types/indexer';

export class Indexer {
  url: string;
  constructor(network:string) {
    this.url = (network === 'arkhia_test' || network === 'hedera_test') ? DOMAIN_EP_TEST : DOMAIN_EP_MAIN;
  }

  async getDomainInfo(sld:string): Promise<AxiosResponse<DomainInfo>> {
    const res = await axios.get(`${this.url}/domain?domain=${sld}`);
    return res;
  }
  async getAllAccountsDomain(accountId:string): Promise<AxiosResponse<DomainInfo[]>> {
    const res = await axios.get(`${this.url}/account/${accountId}`);
    return res;
  }
  async getRegistry(query:string): Promise<AxiosResponse<DomainInfo[]>> {
    const res = await axios.get(`${this.url}/registry${query}`);
    return res;
  }
}

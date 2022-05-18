/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
import Web3 from 'web3';

export class JsonRpcService {
  contractAddr : string;
  abi : any;
  providerString : string;
  provider : any; // to-do ethers provider type
  contract: any; // to-do ethers type
  constructor(contractAddr: string, abi: any, providerString: string) {
    this.contractAddr = contractAddr;
    this.providerString = providerString;
    this.provider = new Web3(new Web3.providers.HttpProvider(this.providerString));
    this.abi = abi;
    this.contract = new this.provider.eth.Contract(abi, contractAddr);
  }
}

export class HNSContractService extends JsonRpcService {
  async getMaxRecords() {
    const nodes = await this.contract.methods.getNodes().call();
    return Number(nodes);
  }
}
export class TLDContractService extends HNSContractService {
  async getNodes() {
    const nodes = await this.contract.methods.getNodes().call();
    return nodes;
  }
  async getNumNodes() {
    const nodeNumber = await this.contract.methods.getNumNodes().call();
    return Number(nodeNumber);
  }
  async getSLDNode(sldHash: any, start: any, stop: any) {
    const node = await this.contract.methods.getSerial(sldHash, start, stop).call();
    return node;
  }
}

export class SLDContractService extends HNSContractService {
  async getExpiry(sldHash: any) {
    const expiration = Number(await this.contract.methods.getExpiry(sldHash).call());
    return expiration;
  }
  async getSerial(sldHash: any) {
    const expiration = await this.contract.methods.getSerial(sldHash).call();
    return Number(expiration);
  }
}

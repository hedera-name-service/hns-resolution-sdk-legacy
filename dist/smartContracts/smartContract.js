"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLDContractService = exports.TLDContractService = exports.HNSContractService = exports.JsonRpcService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-classes-per-file */
const web3_1 = __importDefault(require("web3"));
class JsonRpcService {
    constructor(contractAddr, abi, providerString) {
        this.contractAddr = contractAddr;
        this.providerString = providerString;
        this.provider = new web3_1.default(new web3_1.default.providers.HttpProvider(this.providerString));
        this.abi = abi;
        this.contract = new this.provider.eth.Contract(abi, contractAddr);
    }
}
exports.JsonRpcService = JsonRpcService;
class HNSContractService extends JsonRpcService {
    async getMaxRecords() {
        const nodes = await this.contract.methods.getNodes().call();
        return Number(nodes);
    }
}
exports.HNSContractService = HNSContractService;
class TLDContractService extends HNSContractService {
    async getNodes() {
        const nodes = await this.contract.methods.getNodes().call();
        return nodes;
    }
    async getNumNodes() {
        const nodeNumber = await this.contract.methods.getNumNodes().call();
        return Number(nodeNumber);
    }
    async getSLDNode(sldHash, start, stop) {
        const node = await this.contract.methods.getSerial(sldHash, start, stop).call();
        return node;
    }
}
exports.TLDContractService = TLDContractService;
class SLDContractService extends HNSContractService {
    async getExpiry(sldHash) {
        const expiration = Number(await this.contract.methods.getExpiry(sldHash).call());
        return expiration;
    }
    async getSerial(sldHash) {
        const expiration = await this.contract.methods.getSerial(sldHash).call();
        return Number(expiration);
    }
}
exports.SLDContractService = SLDContractService;

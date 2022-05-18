export declare class JsonRpcService {
    contractAddr: string;
    abi: any;
    providerString: string;
    provider: any;
    contract: any;
    constructor(contractAddr: string, abi: any, providerString: string);
}
export declare class HNSContractService extends JsonRpcService {
    getMaxRecords(): Promise<number>;
}
export declare class TLDContractService extends HNSContractService {
    getNodes(): Promise<any>;
    getNumNodes(): Promise<number>;
    getSLDNode(sldHash: any, start: any, stop: any): Promise<any>;
}
export declare class SLDContractService extends HNSContractService {
    getExpiry(sldHash: any): Promise<number>;
    getSerial(sldHash: any): Promise<number>;
}

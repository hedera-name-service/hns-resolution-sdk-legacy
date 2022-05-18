import { SLDContractService, TLDContractService } from './smartContract';
import SLDabi from '../abi/SLDNode.json';
import TLDabi from '../abi/TLDNode.json';

export const getSldSmartContract = (evmContract:string, rpcString:string) => new SLDContractService(evmContract, SLDabi, rpcString);
export const getTldSmartContract = (evmContract:string, rpcString:string) => new TLDContractService(evmContract, TLDabi, rpcString);

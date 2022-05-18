import { SLDContractService, TLDContractService } from './smartContract';
import SLDabi from '../abi/SLDNode.json';
import TLDabi from '../abi/TLDNode.json';

export const getSldSmartContract = (evmContract:string) => new SLDContractService(evmContract, SLDabi, 'https://mainnet.hashio.io/api');
export const getTldSmartContract = (evmContract:string) => new TLDContractService(evmContract, TLDabi, 'https://mainnet.hashio.io/api');

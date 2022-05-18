"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTldSmartContract = exports.getSldSmartContract = void 0;
const smartContract_1 = require("./smartContract");
const SLDNode_json_1 = __importDefault(require("../abi/SLDNode.json"));
const TLDNode_json_1 = __importDefault(require("../abi/TLDNode.json"));
const getSldSmartContract = (evmContract) => new smartContract_1.SLDContractService(evmContract, SLDNode_json_1.default, 'https://mainnet.hashio.io/api');
exports.getSldSmartContract = getSldSmartContract;
const getTldSmartContract = (evmContract) => new smartContract_1.TLDContractService(evmContract, TLDNode_json_1.default, 'https://mainnet.hashio.io/api');
exports.getTldSmartContract = getTldSmartContract;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Indexer = void 0;
const axios_1 = __importDefault(require("axios"));
const routesApi_1 = require("./routesApi");
class Indexer {
    constructor(network) {
        this.url = (network === 'arkhia_test' || network === 'hedera_test') ? routesApi_1.DOMAIN_EP_TEST : routesApi_1.DOMAIN_EP_MAIN;
    }
    async getDomainInfo(sld) {
        const res = await axios_1.default.get(`${this.url}?domain=${sld}`);
        return res;
    }
}
exports.Indexer = Indexer;

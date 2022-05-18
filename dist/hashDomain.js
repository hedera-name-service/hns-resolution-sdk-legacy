"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashDomain = void 0;
const keccak256_1 = __importDefault(require("keccak256"));
/**
* @description Hashes an array of domains
* @param domain: {string[]} Array of domain values
* @returns {Buffer}
 */
const hash = (sld) => sld.reduce((prev, curr) => (0, keccak256_1.default)(prev + curr), Buffer.from(''));
/**
* @description Generate a NameHash object of the provided domain
* @param domain: {string} The domain string to hash
* @returns {Buffer}
 */
const hashDomain = (domain) => {
    const domains = domain.split('.').reverse();
    if (domains.length > 2)
        throw new Error('Invalid domain input');
    const sldHash = hash(domains.slice(0, 2));
    const tldHash = hash(domains.slice(0, 1));
    return { domain, tldHash, sldHash };
};
exports.hashDomain = hashDomain;

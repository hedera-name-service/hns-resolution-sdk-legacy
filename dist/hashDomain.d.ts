import { NameHash } from './types/NameHash';
/**
* @description Generate a NameHash object of the provided domain
* @param domain: {string} The domain string to hash
* @returns {Buffer}
 */
declare const hashDomain: (domain: string) => NameHash;
export { hashDomain };

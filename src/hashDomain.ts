import keccak256 from 'keccak256';
import { NameHash } from './types/NameHash';

/**
* @description Hashes an array of domains
* @param domain: {string[]} Array of domain values
* @returns {Buffer}
 */

const hash = (sld: string[]) => sld.reduce(
  (prev, curr) => keccak256(prev + curr),
  Buffer.from(''),
);

/**
* @description Generate a NameHash object of the provided domain
* @param domain: {string} The domain string to hash
* @returns {Buffer}
 */
const hashDomain = (domain: string): NameHash => {
  const domains: string[] = domain.split('.').reverse();
  if (domains.length > 2) throw new Error('Invalid domain input');

  const sldHash = hash(domains.slice(0, 2));
  const tldHash = hash(domains.slice(0, 1));

  return { domain, tldHash, sldHash } as NameHash;
};

export { hashDomain };

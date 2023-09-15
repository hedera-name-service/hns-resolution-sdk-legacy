// import * as uts46 from 'idna-uts46-hx';
import { NameHash } from '../types/NameHash';

export const isNameHash = (object: any): object is NameHash => 'domain' in object;

export const formatHederaTxId = (str: string) => {
  let txId = str
    .replace('@', '-')
    .trim();
  while ((txId.match(/\./g) ?? []).length > 2) {
    const index = txId.lastIndexOf('.');
    const formattedTxId = `${txId.slice(0, index)}-${txId.slice(index + 1).padStart(9, '0')}`;
    txId = formattedTxId;
  }
  return txId;
};

// export const normalize = (name:string) => (name ? uts46.toUnicode(name, { useStd3ASCII: true }) : name);

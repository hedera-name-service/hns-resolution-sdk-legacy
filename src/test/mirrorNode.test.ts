 import { MirrorNode, NetworkType, NetworkBaseURL } from '../mirrorNode';

 test('MirrorNode is created with correct type.', () => {
   const networkType: NetworkType = 'hedera_test';
   const mirrorNode = new MirrorNode(networkType);
   expect(mirrorNode.networkType).toBe(networkType);
 });

 test('MirrorNode is created with correct baseUrl.', () => {
   const networkType: NetworkType = 'hedera_test';
   const mirrorNode = new MirrorNode(networkType);
   expect(mirrorNode.baseUrl).toBe(NetworkBaseURL.hedera_test);
 });

 test('MirrorNode without auth key has empty auth key.', () => {
   const networkType: NetworkType = 'hedera_test';
   const mirrorNode = new MirrorNode(networkType);
   expect(mirrorNode.authKey).toBe('');
 });

 test('MirrorNode with auth key has correct auth key.', () => {
   const networkType: NetworkType = 'hedera_test';
   const authKey = '70c8967789b048dea4ebe70f28d213e6';
   const mirrorNode = new MirrorNode(networkType, authKey);
   expect(mirrorNode.authKey).toBe(authKey);
 });

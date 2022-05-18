"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mirrorNode_1 = require("../mirrorNode");
test('MirrorNode is created with correct type.', () => {
    const networkType = 'hedera_test';
    const mirrorNode = new mirrorNode_1.MirrorNode(networkType);
    expect(mirrorNode.networkType).toBe(networkType);
});
test('MirrorNode is created with correct baseUrl.', () => {
    const networkType = 'hedera_test';
    const mirrorNode = new mirrorNode_1.MirrorNode(networkType);
    expect(mirrorNode.baseUrl).toBe(mirrorNode_1.NetworkBaseURL.hedera_test);
});
test('MirrorNode without auth key has empty auth key.', () => {
    const networkType = 'hedera_test';
    const mirrorNode = new mirrorNode_1.MirrorNode(networkType);
    expect(mirrorNode.authKey).toBe('');
});
test('MirrorNode with auth key has correct auth key.', () => {
    const networkType = 'hedera_test';
    const authKey = '70c8967789b048dea4ebe70f28d213e6';
    const mirrorNode = new mirrorNode_1.MirrorNode(networkType, authKey);
    expect(mirrorNode.authKey).toBe(authKey);
});

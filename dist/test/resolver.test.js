"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
jest.setTimeout(60 * 1000);
test('Unstoppable Domain resolves to an address', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    const result = await resolver.resolveSLD('aaronquirk.x');
    await resolver.dispose();
    expect(result).toBeTruthy();
});
test('.cream name resolves to an address', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    const result = await resolver.resolveSLD('0.cream');
    await resolver.dispose();
    expect(result).toBeTruthy();
});
test('.hbar name resolves to an address', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    const result = await resolver.resolveSLD('nate.hbar');
    await resolver.dispose();
    expect(result).toBeTruthy();
});
test('can get domains by domain', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    // wait 10 seconds to catch up on the SLD topics. We could use await resolver.isCaughtUpPromise, but this will take too long. 10 seconds is sufficient.
    await new Promise(resolve => setTimeout(resolve, 10000));
    const result = await resolver.getAllDomainsForAccount('0.hbar');
    await resolver.dispose();
    expect(result.length).toBeGreaterThanOrEqual(1);
});
test('can get domains by account id', async () => {
    const resolver = new __1.Resolver('hedera_main');
    resolver.init();
    // wait 10 seconds to catch up on the SLD topics. We could use await resolver.isCaughtUpPromise, but this will take too long. 10 seconds is sufficient.
    await new Promise(resolve => setTimeout(resolve, 10000));
    const result = await resolver.getAllDomainsForAccount('0.0.601681');
    await resolver.dispose();
    expect(result.length).toBeGreaterThanOrEqual(1);
});

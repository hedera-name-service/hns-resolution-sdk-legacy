# HNS resolution SDK

In **Hashgraph Name Service**'s effort to create a web3 username public good, we'd like to also deliver a public SDK available for use by any entity that wants to resolve hashgraph names to empower their own solutions.


Implementation (no key argument needs to be supplied for hedera_test and hedera_main values) :

    import { Resolver } from 'hns-resolution-sdk'

    const resolver =  new Resolver('arkhia_main', 'arkhia_header', 'arkhia_key'); **OR**  const resolver = new Resolver('hedera_main')
    resolver.init();

Name Resolution Example:

    const accountId =  await resolver.resolveSLD('palacios.hbar');
    return => "0.0.xxxxxxx"
Currently Supported Service Types: The values

    hedera_test, hedera_main, arkhia_test, arkhia_main

are currently supported by this SDK.

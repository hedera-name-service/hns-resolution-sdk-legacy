# HNS resolution SDK

The HNS namespace currently includes `.hbar`, `.boo`, and `.cream` TLDs, which are native to HNS. Since the namespace will expand over time, a hardcoded list of TLDs for recognizing HNS names will regularly be out-of-date. The HNS Resolution SDK ensures a correct resolution of account holders and their domains.

## Name Resolution

Domains can have many types of data associated with them; the most common is cryptocurrency addresses, or Hedera Account IDs in the context of HNS.

### Installation

Install the SDK. There are no additional peer dependencies required at this time.

```
npm install @hedera-name-service/hns-resolution-sdk
```

### Initialization

Initialize the resolver by defining the API service you will use with the SDK and JSON-RPC Provider. The SDK currently supports the following services:

- `hedera_main`: [Hedera Mainnet Public Mirror Node](https://docs.hedera.com/hedera/core-concepts/mirror-nodes/hedera-mirror-node#mainnet)
- `hedera_test`: [Hedera Testnet Public Mirror Node](https://docs.hedera.com/hedera/core-concepts/mirror-nodes/hedera-mirror-node#testnet)

Example to initialize resolver with `hedera_main`:

```javascript
import { Resolver } from "hns-resolution-sdk";
// Which will use the default JSON-RPC Provider, Hashio.io
const resolver = new Resolver("hedera_main");
```

- `arkhia_main`: Hedera Mainnet Arkhia API Service
- `arkhia_test`: Hedera Testnet Arkhia API Service

Example to initialize resolver with `arkhia_main`:

```javascript
import { Resolver } from "hns-resolution-sdk";
// Which will use the default JSON-RPC Provider, Hashio.io
const resolver = new Resolver("arkhia_main", "arkhiaUrl", "x-api-key", `${process.env.apiKey}`);
```

Example to use Arkhia JSON-RPC with `arkhia_main`:

```javascript
import { Resolver } from "hns-resolution-sdk";

const resolver = new Resolver(
  "arkhia_main",
  "arkhiaUrl",
  "x-api-key",
  `${process.env.apiKey}`,
  `arkhiaJrpcUrl`,
);
```

> **Note:** The example above demonstrates how to initialize the resolver with [Arkhia](https://arkhia.io). This is only for demonstration purposes and should not be implemented on any client side code. Always keep your API keys hidden!

**Note:** There is an env.example with setup example for easy set up for developers

### Resolving Domains from Account IDs

HNS supports reverse resolution to all applications to display HNS names in place of Hedera Account IDs or other data associated with the HNS name(s).

> HNS does not enforce the accuracy of reverse records - for instance, anyone may claim that the name for their address is `hns.hbar`. To be certain that the claim is correct, you must always perform the reverse resolution and render the returned value(s).

#### `Resolver.getAllDomainsForAccount`

#### Method:

`getAllDomainsForAccount(accountId: string): Promise<string[]>`

#### Parameter:

`accountId: string`: A Hedera Account ID in the format of `0.0.<Account>`. Read the docs on [Hedera Account IDs](https://docs.hedera.com/hedera/core-concepts/accounts/account-properties#account-id) for more info.

#### Return:

`Promise<string[]>`: An array of domains that the the specified `accountId` owns or maps to. The method will return an empty array the `accountId` does not own or resolve to any domains.

#### Example:

```javascript
// Initialize the resolver
const res = await resolver.getAllDomainsForAccount(`0.0.800`);
// []
```

### Resolving domain names

Domains can have many types of data associated with them; the most common is cryptocurrency addresses, or in the context of Hedera, account IDs. HNS supports storing and resolving the account IDs from a given domain name, if associated.

#### `Resolver.resolveSLD`

#### Method:

`resolveSLD(domain: string): Promise<string | undefined>`

#### Parameter:

`domain: string`: Any valid string that could represent a domain name.

#### Return:

`Promise<string | undefined>`: If the specified domain name resolves to an account ID, the account ID will be returned. If it does not resolve to an account ID, `undefined` is returned.

#### Example:

```javascript
// Initialize the resolver
const res = await resolver.resolveSLD(`hns.hbar`);
// 0.0.838546
```

### Get Domain Information

You will need to know the domain name, Hedera transaction ID, or the name hash in order to get the domain records.

### `Resolver.getDomainInfo`

#### Method:

`getDomainInfo(domainOrNameHashOrTxId: string | NameHash): Promise<DomainInfo>`

#### Parameter:

`domainOrNameHashOrTxId: string | NameHash`: A domain name, NameHash object, or [Hedera transaction ID](https://docs.hedera.com/hedera/sdks-and-apis/sdks/transactions/transaction-id). The transaction ID must be in either of these formats: &lt;accountId&gt;@&lt;seconds&gt;.&lt;nanoseconds&gt; or &lt;accountId&gt;-&lt;seconds&gt;.&lt;nanoseconds&gt;.

#### Return:

`Promise<DomainInfo>`: An object that represents the requested domain information.

##### Errors:

`new Error('Invalid Input')`: The parameter is formatted incorrectly or incompatible

`new Error('Unable to find metadata')`: The parameter is not yet registered

`new Error('No Contract Address')`; The Json RPC wasn't able to find contract information

#### Example:

```javascript
// Initialize the resolver
const res = await resolver.getDomainInfo(`hns.hbar`);
// {}
```

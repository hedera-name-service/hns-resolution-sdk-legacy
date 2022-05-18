export interface SecondLevelDomain {
    transactionId: string;
    nameHash: {
        domain: string;
        tldHash: string;
        sldHash: string;
    };
    nftId: string;
    provider: string;
    providerData: {
        contractId: string;
    };
    sequenceNumber: number;
}

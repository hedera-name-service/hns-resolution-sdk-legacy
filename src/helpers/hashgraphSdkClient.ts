import { Client } from '@hashgraph/sdk';

export const client = Client.forMainnet().setOperator(process.env.OPERATOR_ID ?? '', process.env.OPERATOR_PVKEY ?? '');

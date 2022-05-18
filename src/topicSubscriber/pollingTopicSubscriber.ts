import axios from 'axios';
import { getBaseUrl, MAX_PAGE_SIZE, NetworkType } from '../mirrorNode';
import { MessageObject } from '../types/MessageObject';
import MessagesResponse from '../types/MessagesResponse';
import { ResolverOptions } from '../types/ResolverOptions';

export const executeWithRetriesAsync = async <T>(func: (retryNum: number) => Promise<T>, shouldRetry: (err: any) => boolean, maxRetries = 5): Promise<T> => {
  let retryNum = 0;
  while (maxRetries > 0) {
    maxRetries--;
    try {
      return await func(retryNum);
    } catch (err: any) {
      if (maxRetries <= 0 || !shouldRetry(err)) {
        throw err;
      }
      retryNum++;
    }
  }

  throw new Error('Reached maximum retries and did not rethrow error... Should not have gotten here.');
};

const sendGetRequest = async (url: string, authKey?: string, authHeader = '', networkType:string) => executeWithRetriesAsync(async (retryNum) => {
  // Backoff retry for each failed attempt
  await new Promise((resolve) => setTimeout(resolve, retryNum * 250));

  const headers: any = {};
  if (authKey) {
    headers.Authorization = authKey;
  }

  const res = networkType === 'arkhia_main' ? await axios.get(url, {
    headers: { [authHeader]: authKey },
  }) : await axios.get(url);

  return res.data as MessagesResponse;
}, () => true);

export class PollingTopicSubscriber {
  static subscribe(
    networkType: NetworkType,
    topicId: string,
    onMessage: (message: MessageObject) => void,
    onCaughtUp: () => void,
    startingTimestamp = '000',
    authKey?: string,
    authHeader?:string,
    options?: ResolverOptions,
  ): () => void {
    const pollingInterval = options && options.pollingInterval ? options.pollingInterval : 60 * 1000;

    let lastTimestamp = startingTimestamp;
    let calledOnCaughtUp = false;
    let cancelled = false;
    const promise = new Promise<void>(async (resolve) => {
    //   const latestMessageUrl = `${getBaseUrl(networkType)}/api/v1/topics/${topicId}/messages`;
      const latestMessageUrl = `${getBaseUrl(networkType)}/api/v1/topics/${topicId}/messages?limit=1&order=desc`;
      const latestMessageResponse = await sendGetRequest(latestMessageUrl, authKey, authHeader);
      let latestSequenceNumber = 0;
      if (latestMessageResponse.messages.length) {
        latestSequenceNumber = latestMessageResponse.messages[0].sequence_number;
      }

      while (!cancelled) {
        // const url = `${getBaseUrl(networkType)}/api/v1/topics/${topicId}/messages`;
        const url = `${getBaseUrl(networkType)}/api/v1/topics/${topicId}/messages?limit=${MAX_PAGE_SIZE}&timestamp=gt:${lastTimestamp}`;
        const response = await sendGetRequest(url, authKey, authHeader).catch((err) => {
          console.error({
            err,
            message: err.message,
          });
        });
        if (!response) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        const messages = response.messages ? response.messages : [];

        for (const message of messages) {
          if (!cancelled) {
            onMessage(message);
          }
        }

        let lastSequenceNumberFromMessages = 0;
        if (messages.length) {
          lastSequenceNumberFromMessages = messages[messages.length - 1].sequence_number;
        }

        if (!calledOnCaughtUp && lastSequenceNumberFromMessages >= latestSequenceNumber) {
          onCaughtUp();
          calledOnCaughtUp = true;
        }

        if (messages.length === 0) {
          await new Promise<void>((resolve) => {
            let intervalHandle: NodeJS.Timeout | undefined;
            let timeoutHandle: NodeJS.Timer | undefined;

            // This interval allows the promise to resolve early if the subscription is cancelled
            intervalHandle = setInterval(() => {
              if (cancelled) {
                resolve();
                clearTimeout(timeoutHandle);
              }
            }, 250);

            // This timeout will resolve the promise after the pollingInterval has ellapsed
            timeoutHandle = setTimeout(() => {
              resolve();
              clearInterval(intervalHandle);
            }, pollingInterval);
          });
        } else {
          lastTimestamp = messages[messages.length - 1].consensus_timestamp;
        }
      }

      resolve();
    });

    // Return unsubscribe method
    return async () => {
      cancelled = true;
      await promise;
    };
  }
}

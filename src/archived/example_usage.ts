import { HashgraphNames } from './index';

const h = new HashgraphNames();

const resolveSLD = async (Args: string[]) => {
  const wallet = await h.resolveSLD(Args[1]);
  // eslint-disable-next-line no-console
  console.log(wallet.toString());
  process.exit();
};

async function sleep(msec: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, msec));
}

const main = () => {
  const Args = process.argv.slice(2);
  // eslint-disable-next-line no-console
  console.log(`Args: ${Args}`);

  switch (Args[0]) {
    case 'resolveSLD':
      resolveSLD(Args);
      break;
    default:
      // eslint-disable-next-line no-console
      console.log('Unsupported argument');
  }
};

const init = async () => {
  await sleep(2000);
  main();
};

init();

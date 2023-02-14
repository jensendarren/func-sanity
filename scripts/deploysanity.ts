import { toNano } from 'ton-core';
import { Sanity } from '../wrappers/sanity';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const sanity = Sanity.createFromConfig({}, await compile('Sanity'));

    await provider.deploy(sanity, toNano('0.05'));

    const openedContract = provider.open(sanity);

    // run methods on `openedContract`
}

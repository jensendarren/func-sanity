import { toNano } from 'ton-core';
import { SanityTracker } from '../wrappers/SanityTracker';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const sanityTracker = SanityTracker.createFromConfig({id: 0, tracker: 0}, await compile('SanityTracker'));

    await provider.deploy(sanityTracker, toNano('0.05'));

    const openedContract = provider.open(sanityTracker);

    // run methods on `openedContract`
}

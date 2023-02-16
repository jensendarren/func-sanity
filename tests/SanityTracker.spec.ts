import { Blockchain, OpenedContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { SanityTracker } from '../wrappers/SanityTracker';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('SanityTracker', () => {
    let code: Cell;
    let sanityTracker: OpenedContract<SanityTracker>;
    let blockchain: Blockchain;

    beforeAll(async () => {
        code = await compile('SanityTracker');
        blockchain = await Blockchain.create();
    
        sanityTracker = blockchain.openContract(SanityTracker.createFromConfig({id: 0, tracker: 0}, code));
    
        const deployer = await blockchain.treasury('deployer');
    
        const deployResult = await sanityTracker.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sanityTracker.address,
            deploy: true,
        });
    });

    it('should keep track of an accumulating value', async () => {
        const sender = await blockchain.treasury("sender");

        await sanityTracker.sendTracker(sender.getSender(), {tracker: 99, value: toNano('0.05')});
        const result1 = await sanityTracker.getTracker();
        expect(result1).toBe(99);

        await sanityTracker.sendTracker(sender.getSender(), {tracker: 74, value: toNano('0.05')});
        const result2 = await sanityTracker.getTracker();        
        expect(result2).toBe(173); // 99 + 74
    });
});

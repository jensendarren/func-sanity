import { Blockchain, OpenedContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Sanity } from '../wrappers/Sanity';
import { SanityTracker } from '../wrappers/SanityTracker';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Sanity', () => {
    let codeSanity: Cell;
    let codeSanityTracker: Cell;
    let blockchain: Blockchain;
    let sanity: OpenedContract<Sanity>;
    let sanityTracker: OpenedContract<SanityTracker>;

    beforeAll(async () => {
        codeSanity = await compile('Sanity');
        codeSanityTracker = await compile('SanityTracker');
        blockchain = await Blockchain.create();

        // uncomment to get really verbose debug messaging!
        // blockchain.verbosity = {
        //   blockchainLogs: true,
        //   vmLogs: "vm_logs_full",
        //   debugLogs: true,
        // }
        
        sanityTracker = blockchain.openContract(SanityTracker.createFromConfig({id: 0, tracker: 0}, codeSanityTracker));
        sanity = blockchain.openContract(Sanity.createFromConfig({id: 0, result: 0, tracker_contract_addr: sanityTracker.address}, codeSanity));

        const deployer = await blockchain.treasury('deployer');
        const deploySanityResult = await sanity.sendDeploy(deployer.getSender(), toNano('0.05'));
        const deploySanityTrackerResult = await sanityTracker.sendDeploy(deployer.getSender(), toNano('0.05'));
        
        expect(deploySanityResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sanity.address,
            deploy: true,
        });

        expect(deploySanityTrackerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sanityTracker.address,
            deploy: true,
        });
    });

    it('should set the tracker contract address on deployment', async () => {
        const sanityTrackerAddress = await sanity.getTrackerContractAddress();
        expect(sanityTrackerAddress.toString()).toBe(sanityTracker.address.toString());
    })

    it('should add two numbers', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            // console.log(`increase ${i + 1}/${increaseTimes}`);

            const a = Math.floor(Math.random() * 100);
            const b = Math.floor(Math.random() * 100);

            // console.log('a vaule: ', a);
            // console.log('b value: ', b);
            
            const trackerValueBefore = await sanityTracker.getTracker();
            // console.log('trackerValueBefore: ', trackerValueBefore);

            const adder = await blockchain.treasury('adder ' + i);
            const receipt = await sanity.sendSum(adder.getSender(), { a, b, value: toNano('0.05') });
            
            expect(receipt.transactions).toHaveTransaction({
                from: adder.address,
                to: sanity.address,
                success: true,
            });

            const resultSum = await sanity.getResult();
            expect(resultSum).toBe(a+b);
            
            const trackerValueAfter = await sanityTracker.getTracker();
            expect(trackerValueAfter).toBe(trackerValueBefore + resultSum);
            // console.log('trackerValueAfter: ', trackerValueAfter);
        }
    })
});

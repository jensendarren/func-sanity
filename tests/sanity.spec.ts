import { Blockchain, OpenedContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Sanity } from '../wrappers/Sanity';
import { SanityTracker } from '../wrappers/SanityTracker';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { randomAddress } from '@ton-community/test-utils';

describe('Sanity', () => {
    let codeSanity: Cell;
    let codeSanityTracker: Cell;
    let blockchain: Blockchain;
    let sanity: OpenedContract<Sanity>;
    let sanityTracker: OpenedContract<SanityTracker>;
    const ownerAddress = randomAddress();
    
    beforeAll(async () => {
        codeSanity = await compile('Sanity');
        codeSanityTracker = await compile('SanityTracker');
        blockchain = await Blockchain.create();


        // uncomment to get really verbose debug messaging!
        // blockchain.verbosity = {
        //   blockchainLogs: true,
        //   vmLogs: "vm_logs",
        //   debugLogs: true,
        // }
        
        sanityTracker = blockchain.openContract(SanityTracker.createFromConfig({id: 0, tracker: 0}, codeSanityTracker));
        sanity = blockchain.openContract(Sanity.createFromConfig({  owner: ownerAddress, 
                                                                    id: 0, 
                                                                    result: 0, 
                                                                    tracker_contract_addr: sanityTracker.address
                                                                }, codeSanity));

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

    it('should set the owner address on deployment', async () => {
        const sanityOwnerAddress = await sanity.getOwner()
        expect(sanityOwnerAddress.toString()).toBe(ownerAddress.toString());
    })

    it('should add two numbers', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            const a = Math.floor(Math.random() * 100);
            const b = Math.floor(Math.random() * 100);
            
            const trackerValueBefore = await sanityTracker.getTracker();

            const adder = await blockchain.treasury('adder ' + i);
            const receipt = await sanity.sendSum(adder.getSender(), { a, b, value: toNano('0.05') });
            
            // Check there is a message from the external address to the contract
            expect(receipt.transactions).toHaveTransaction({
                from: adder.address,
                to: sanity.address,
                success: true,
            });

            // Check there is a message sent between the two contracts
            expect(receipt.transactions).toHaveTransaction({
                from: sanity.address, 
                to: sanityTracker.address,
                success: true
            })

            // Check the sum in the sanity contract is correct
            const resultSum = await sanity.getResult();
            expect(resultSum).toBe(a+b);
            
            // Check the accumulating sum in the sanity tracker contract is correct
            const trackerValueAfter = await sanityTracker.getTracker();
            expect(trackerValueAfter).toBe(trackerValueBefore + resultSum);
        }
    })
});

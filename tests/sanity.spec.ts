import { Blockchain, OpenedContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Sanity } from '../wrappers/sanity';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Sanity', () => {
    let code: Cell;
    // let sanityContract: OpenedContract<Sanity>;

    beforeAll(async () => {
        code = await compile('Sanity');
    });

    // it('should deploy', async () => {
    //     const blockchain = await Blockchain.create();

    //     const sanity = blockchain.openContract(Sanity.createFromConfig({}, code));

    //     const deployer = await blockchain.treasury('deployer');

    //     const deployResult = await sanity.sendDeploy(deployer.getSender(), toNano('0.05'));

    //     expect(deployResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: sanity.address,
    //         deploy: true,
    //     });
    // });

    it('should add two numbers', async () => {
        const blockchain = await Blockchain.create();
        const sanity = blockchain.openContract(Sanity.createFromConfig({id: 0, result: 0}, code));
        const deployer = await blockchain.treasury('deployer');
        const deployResult = await sanity.sendDeploy(deployer.getSender(), toNano('0.05'));
        
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: sanity.address,
            deploy: true,
        });

        const adder = await blockchain.treasury('adder');
        const receipt = await sanity.sendSum(adder.getSender(), { a: 4, b: 4, value: toNano('0.05') });

        expect(receipt.transactions).toHaveTransaction({
            from: adder.address,
            to: sanity.address,
            success: true,
        });

        const result = await sanity.getResult();
        expect(result).toBe(8);
    })
});

import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type SanityTrackerConfig = {
    id: number,
    tracker: number
};

export function sanityTrackerConfigToCell(config: SanityTrackerConfig): Cell {
    return beginCell().storeUint(config.id, 32).storeUint(config.tracker, 32).endCell();
}

export const Opcodes = {
    accumulate: 0xf514ca28,
};

export class SanityTracker implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SanityTracker(address);
    }

    static createFromConfig(config: SanityTrackerConfig, code: Cell, workchain = 0) {
        const data = sanityTrackerConfigToCell(config);
        const init = { code, data };
        return new SanityTracker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendTracker(
        provider: ContractProvider, 
        via: Sender,
        opts: {
            tracker: number,
            value: bigint;
            queryID?: number;
        }) {
            await provider.internal(via, {
                value: opts.value, 
                sendMode: SendMode.PAY_GAS_SEPARATLY,
                body: 
                    beginCell()
                    .storeUint(Opcodes.accumulate, 32)
                    .storeUint(opts.queryID ?? 0, 64)
                    .storeUint(opts.tracker, 32)
                    .endCell(),
            });
        }

    async getTracker(provider: ContractProvider) {
        const result = await provider.get('get_tracker', []);
        return result.stack.readNumber();
    }
}

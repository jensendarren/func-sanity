import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type SanityConfig = {
    owner: Address,
    id: number,
    result: number,
    tracker_contract_addr: Address
};

export function sanityConfigToCell(config: SanityConfig): Cell {
    return beginCell()
            .storeAddress(config.owner)
            .storeUint(config.id, 32)
            .storeUint(config.result, 32)
            .storeAddress(config.tracker_contract_addr)
        .endCell();
}

export function decodeConfig(cell: Cell) {
    let slice = cell.beginParse();

    return {
        owner: slice.loadAddress().toString(),
        id: slice.loadUint(32),
        result: slice.loadUint(32),
        tracker_contract_addr: slice.loadAddress().toString()
    }
}

export const Opcodes = {
    add: 0x9decfca4,
};

export class Sanity implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Sanity(address);
    }

    static createFromConfig(config: SanityConfig, code: Cell, workchain = 0) {
        const data = sanityConfigToCell(config);
        const init = { code, data };
        return new Sanity(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendSum(
        provider: ContractProvider, 
        via: Sender,
        opts: {
            a: number,
            b: number,
            value: bigint;
            queryID?: number;
        }) {
            await provider.internal(via, {
                value: opts.value, 
                sendMode: SendMode.PAY_GAS_SEPARATLY,
                body: 
                    beginCell()
                    .storeUint(Opcodes.add, 32)
                    .storeUint(opts.queryID ?? 0, 64)
                    .storeUint(opts.a, 32)
                    .storeUint(opts.b, 32)
                    .endCell(),
            });
        }

    async getOwner(provider: ContractProvider) {
        const result = await provider.get('owner', []);
        return result.stack.readAddress();
    }

    async getResult(provider: ContractProvider) {
        const result = await provider.get('get_result', []);
        return result.stack.readNumber();
    }

    async getTrackerContractAddress(provider: ContractProvider) {
        const result = await provider.get('get_tracker_contract_addr', []);
        return result.stack.readAddress();
    }

    async getConfig(provider: ContractProvider) {
        const configCell = await (await provider.get('config', [])).stack.readCell();
        return decodeConfig(configCell);
    }
}

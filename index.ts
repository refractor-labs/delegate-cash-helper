import { ethers } from 'ethers';
import {DelegateCash} from "delegatecash";
const ADDRESS = "0x00000000000076a84fef008cdabe6409d2fe638b";

const alchemyApiKey='your key here'

async function main() {
    const provider = new ethers.providers.AlchemyProvider('homestead',alchemyApiKey);

    const dc = new DelegateCash(provider);

    const getFilter = (fromBlock: number, toBlock: number): ethers.providers.Filter => {
        return {
            address: ADDRESS,
            topics: [], //[topics.map((t) => ethers.utils.id(t))],
            fromBlock,
            toBlock,
        };
    };

    const latestBlock = await provider.getBlockNumber();
    let fromBlock = 0;
    let toBlock = latestBlock;
    const logsAll = [];
    let queryCount = 0;
    while (true) {
        queryCount++;
        try {
            const logs = await provider.getLogs(getFilter(fromBlock, toBlock));
            logsAll.push(...logs);

            if (toBlock === latestBlock && logs.length === 0) {
                break;
            }
            fromBlock = logs.length ? logs[logs.length - 1].blockNumber + 1 : toBlock + 1;
            toBlock = latestBlock;
        } catch (e) {
            toBlock = fromBlock + Math.floor((toBlock - fromBlock) / 2);
        }
    }

    const vaults = logsAll
        .map((log) => {
            try {
                const parsed = dc.delegationContract.interface.parseLog(log);
                const { vault } = parsed.args;
                return vault as string;
            } catch (e) {
                return null;
            }
        })
        .filter((v) => v !== null) as string[];
    const unique=new Set(vaults)
    console.log(JSON.stringify(Array.from(unique.values()), null, 2));
    console.log('found', unique.size, 'vaults');
}

main();

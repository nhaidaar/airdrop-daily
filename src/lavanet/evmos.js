import Web3 from 'web3';
import { evmosRPC } from './rpc.js';

const web3 = new Web3(evmosRPC);

export const evmos_checkBalance = (address) => {
    return new Promise((resolve, reject) => {
        web3.eth.getBalance(address)
            .then(res => {
                const balance = web3.utils.fromWei(res, "ether");
                resolve(balance);
            })
            .catch(err => {
                reject(err);
            })
    });
}
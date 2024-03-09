import Web3 from 'web3';
import { ethRPC } from './rpc.js';

const web3 = new Web3(ethRPC);

export const eth_checkBalance = (address) => {
    return new Promise(async (resolve, reject) => {
        await web3.eth.getBalance(address)
            .then(res => {
                const balance = web3.utils.fromWei(res, "ether");
                resolve(balance);
            })
            .catch(err => {
                reject(err);
            })
    });
}
import crypto from "crypto";
import BigNumber from "bignumber.js"
import { Twisters } from "twisters";
import { readFileSync } from "fs";
import { near_checkBalance } from "./near.js";
import { eth_checkBalance } from "./eth.js";
import { evmos_checkBalance } from "./evmos.js";

const twisters = new Twisters();
let nearExecuted = 0;
let ethExecuted = 0;
let evmosExecuted = 0;
let nearError = 0;
let ethError = 0;
let evmosError = 0;

const nearExecute = (ACCOUNT_ID, PRIVATE_KEY) => {
    return new Promise((resolve, reject) => {
        near_checkBalance(ACCOUNT_ID, PRIVATE_KEY)
            .then(res => {
                nearExecuted += 1;
                twisters.put(ACCOUNT_ID, {
                    text: `
=== NEAR ===
Account : ${ACCOUNT_ID}
Balance : ${BigNumber(res.balance.available).dividedBy(1e24).toFixed(2)} NEAR
Error : ${nearError}
Executed : ${nearExecuted}
`
                });
                resolve();
            })
            .catch(err => {
                nearError += 1;
                twisters.put(ACCOUNT_ID, {
                    text: `
=== NEAR ===
Account : ${ACCOUNT_ID}
Balance : - NEAR
Error : ${nearError}
Executed : ${nearExecuted}
`
                });
                resolve();
            });
    });
}

const ethExecute = (address) => {
    return new Promise((resolve, reject) => {
        eth_checkBalance(address)
        .then(balance => {
                ethExecuted += 1;
                twisters.put(address, {
                    text: `
=== ETH ===
Account : ${address}
Balance : ${balance} ETH
Error : ${ethError}
Executed : ${ethExecuted}
`
                });
                resolve();
            })
            .catch(err => {
                ethError += 1;
                twisters.put(address, {
                    text: `
=== ETH ===
Account : ${address}
Balance : - ETH
Error : ${ethError}
Executed : ${ethExecuted}
`
                });
                resolve();
            });
    });
}

const evmosExecute = (address) => {
    return new Promise((resolve, reject) => {
        evmos_checkBalance(address)
            .then(balance => {
                evmosExecuted += 1;
                twisters.put(`${address}evmos`, {
                    text: `
=== EVMOS ===
Account : ${address}
Balance : ${balance} EVMOS
Error : ${evmosError}
Executed : ${evmosExecuted}
`
                });
                resolve();
            })
            .catch(err => {
                evmosError += 1;
                twisters.put(`${address}evmos`, {
                    text: `
=== EVMOS ===
Account : ${address}
Balance : - EVMOS
Error : ${evmosError}
Executed : ${evmosExecuted}
`
                });
                resolve();
            });
    });
}

const setDelay = (delay) => {
    return new Promise((resolve, reject) => {
        return setTimeout(resolve, delay);
    });
}

(async () => {
    while (true) {
        try {
            // NEAR
            const listAccounts = readFileSync("config/near.txt", "utf-8")
                                .split("\n")
                                .map((acc) => acc.trim());
            const account = listAccounts[0];
            const [ACCOUNT_ID, PRIVATE_KEY] = account.split("|");
            await nearExecute(ACCOUNT_ID, PRIVATE_KEY);

            // ETH
            const address = "0x577704b66a0554cE944E9185B7b851FeE4AADF4a";
            await ethExecute(address);

            // EVMOS
            await evmosExecute(address);

            // SET RANDOM DELAY
            const randomSeconds = crypto.randomInt(1, 20);
            await setDelay(randomSeconds*1000);
        } catch (error) {
            console.error(error);
        }
    }
})();
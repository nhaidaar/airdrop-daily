import { readFileSync } from "fs";
import { JsonRpcProvider, Wallet } from "ethers";
import fetch from "node-fetch";
import prompts from "prompts";
import crypto from "crypto";
import moment from "moment";

let getRPC = readFileSync('config/rpc.json');
let rpc = JSON.parse(getRPC);

let headers = {
    'authority': 'interface.carv.io',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.5',
    'content-type': 'application/json',
    'origin': 'https://protocol.carv.io',
    'referer': 'https://protocol.carv.io/',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Brave";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'x-app-id': 'carv'
};

function extractAddressParts(address) {
    if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('Invalid address format');
    }
  
    const firstThree = address.slice(0, 4);
    const lastFour = address.slice(-4);
    return `${firstThree}...${lastFour}`;
}

function formHexData(string) {
    if (typeof string !== 'string') {
        throw new Error('Input must be a string.');
    }
    if (string.length > 64) {
        throw new Error('String length exceeds 64 characters.');
    }
    return '0'.repeat(64 - string.length) + string;
}

const sendMessage = async (message) => {
    const token = ''
    const chatid = ''
    const boturl = `https://api.telegram.org/bot${token}/sendMessage`;

    await fetch(boturl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatid,
            link_preview_options: {is_disabled: true},
            text: message,
        }),
    });
};

const login = (wallet) => new Promise((resolve, reject) => {
    const address = wallet.address;
    const msg = `Hello! Please sign this message to confirm your ownership of the address. This action will not cost any gas fee. Here is a unique text: ${Date.now()}`;
    wallet.signMessage(msg)
    .then(signature => {
        const data = {
            wallet_addr: address,
            text: msg,
            signature: signature,
        };

        getToken(data)
        .then(token => {
            const bearer = "bearer " + Buffer.from(`eoa:${token}`).toString('base64');
            headers = {
            ...headers,
            'authorization': bearer
            };

            resolve(bearer);
        })
        .catch(error => reject(error));
    })
    .catch(error => reject(error));
});

const getToken = (data) => new Promise((resolve, reject) => {
    fetch('https://interface.carv.io/protocol/login', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            resolve(response.data.token)
        })
        .catch(error => reject(error))
});

const mintSoul = (wallet, chain_id) => new Promise((resolve, reject) => {
    const url = 'https://interface.carv.io/airdrop/mint/carv_soul';
    const data = JSON.stringify({
        'chain_id': chain_id, // 2020 - Ronin | 204 - opBNB | 324 - zkSync Era
    });

    fetch(url, {
        method: 'POST',
        headers: headers,
        body: data,
    })
    .then(response => response.json())
    .then(async response => {
        if (chain_id === 2020 || response.code !== 0) {
            resolve(response);
        } else {
            const permit = response.data.permit;
            const signature = response.data.signature;
            const contract = response.data.contract;
        
            const addressData = formHexData(permit.account.substring(2));
            const amountData = formHexData(permit.amount.toString(16));
            const ymdData = formHexData(permit.ymd.toString(16));
            const transactionData = `0xa2a9539c${addressData}${amountData}${ymdData}00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000041${signature.substring(2)}00000000000000000000000000000000000000000000000000000000000000`;

            try {
                const gasPrice = await wallet.provider.getFeeData().gasPrice;
                const nonce = await wallet.getNonce();
                var transaction = {
                    to: contract,
                    data: transactionData,
                };
                const gasLimit = await wallet.estimateGas(transaction);

                transaction = {
                    ...transaction,
                    gasPrice: gasPrice,
                    gasLimit: gasLimit,
                    nonce: nonce,
                    value: 0
                };

                await wallet.sendTransaction(transaction);
                resolve(response);
            } catch (e) {
                const error = e.info.error;
                resolve({
                    code: error.code,
                    msg: error.message,
                });
            }
        }
    })
});

const randomizeTime = () => {
    const tomorrow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const randomMinutes = crypto.randomInt(1, 5) * 60 * 1000; // minutes in milliseconds
    const delay = tomorrow + randomMinutes;
    return delay;
}

const setDelay = (delay) => {
    return new Promise((resolve, reject) => {
        return setTimeout(resolve, delay);
    });
}

(async () => {    
    const listAccounts = readFileSync("src/carv/wallet.txt", "utf-8")
        .split("\n")
        .map((acc) => acc.trim());

    const q = await prompts([
        {
            type: 'multiselect',
            name: 'chains',
            message: 'Select chain',
            choices: [
                {title: 'Ronin', value: 2020, selected: true},
                {title: 'opBNB', value: 204},
                {title: 'Zksync Era', value: 324},
                {title: 'Linea', value: 59144},
            ],
            min: 1,
            hint: '- Space to select. Return to submit',
            instructions: false,
        },
        {
            type: 'confirm',
            name: 'useBot',
            message: 'Use Telegram Bot as Notification?',
        }
    ]);

    while(true) {
        for (const account of listAccounts) {
            const wallet = new Wallet(account);
            await login(wallet);
            
            for (const chain of q.chains) {
                const provider = new JsonRpcProvider(rpc[chain]["url"]);
                const wallet = new Wallet(account, provider);

                await mintSoul(wallet, chain)
                    .then(async response => {
                        if (response.code !== 0) {
                            const message = `${extractAddressParts(wallet.address)} | Claim Failed, Error ${response.code} - ${response.msg} #${rpc[chain]["name"]}`;
                            console.log(`[${moment().format("HH:mm:ss")}] ${message}`);

                            if (q.useBot) {
                                await sendMessage(message);
                            }
                        } else {
                            const amount = response.data.permit.amount;

                            const message = `${extractAddressParts(wallet.address)} | Claimed ${amount} SOUL #${rpc[chain]["name"]}`;
                            console.log(`[${moment().format("HH:mm:ss")}] ${message}`);
                            
                            if (q.useBot) {
                                await sendMessage(message);
                            }
                        }
                    });

                // Delay 30 secs for each chain (except last index)
                if (q.chains[q.chains.length - 1] !== chain) {
                    const seconds = 30;
                    console.log(`NEXT CHAIN, DELAY FOR ${seconds} SECS...`);
                    await setDelay(seconds*1000); 
                }
            }

            // Delay 60 secs for each account (except last index)
            if (listAccounts[listAccounts.length - 1] !== account) {
                const seconds = 60;
                console.log(`NEXT ACCOUNT, DELAY FOR ${seconds} SECS...`);
                await setDelay(seconds*1000); 
            }
        }

        // Claim again in tomorrow
        const delay = randomizeTime();
        console.log(`[ NEXT CLAIM IN ${moment().add(delay, 'milliseconds').format("HH:mm:ss")} ]`);
        await setDelay(delay);
    }
})();
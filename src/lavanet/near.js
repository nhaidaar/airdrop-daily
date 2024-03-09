import { nearRPC } from "./rpc.js";
import { KeyPair, keyStores, connect } from "near-api-js";

const getAccount = (ACCOUNT_ID, PRIVATE_KEY) => {
    return new Promise(async (resolve, reject) => {
        try {    
            const myKeyStore = new keyStores.InMemoryKeyStore();
            const keyPair = KeyPair.fromString(PRIVATE_KEY);
            await myKeyStore.setKey("mainnet", ACCOUNT_ID, keyPair);
            
            const connection = await connect({
                ...nearRPC,
                keyStore: myKeyStore,
            });
            const account = await connection.account(ACCOUNT_ID);
            
            resolve(account);
        } catch (error) {
            reject(error);
        }
    });
}

export const near_checkBalance = async (ACCOUNT_ID, PRIVATE_KEY) => {
    const accountDetails = await getAccount(ACCOUNT_ID, PRIVATE_KEY);
    const balance = await accountDetails.getAccountBalance();
    return { accountDetails, balance };
}
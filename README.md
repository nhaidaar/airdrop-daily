# Automation for Airdrop Daily Task

- Clone this repo

```
git clone https://github.com/nhaidaar/airdrop-daily
```

- Install requirements

```
npm install
```

## CARV Protocol

Daily claim for $SOUL on Ronin, opBNB, zkSync, and Linea.

- Edit `src/carv/wallet.txt` with your private key
- Run `node src/carv/index.js`
- Select which chain that you're wanna claim
- Daily claim on 7 AM (Based on your time)

## Lavanet Point

Check your account balance with your own Lava RPC.

- Edit `config/near.txt` with your near mainnet address and private key
- Edit with your EVM Address in `lavanet/index.js`
- Run `node src/lavanet/index.js`

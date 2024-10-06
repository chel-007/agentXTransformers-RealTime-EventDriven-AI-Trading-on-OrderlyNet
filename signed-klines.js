import { getPublicKeyAsync, signAsync } from '@noble/ed25519';
import { encodeBase58 } from 'ethers'; // Adjusted import for ethers
import fetch from 'node-fetch'; // Ensure you have node-fetch installed
import fs from 'fs';
import crypto from 'crypto';

if (typeof global.crypto === 'undefined') {
    global.crypto = {
      subtle: require('crypto').webcrypto.subtle,
    };
  }

async function signAndSendRequest(
  orderlyAccountId,
  orderlyKey,
  input,
  init = {}
) {
  const timestamp = Date.now();
  const encoder = new TextEncoder();

  const url = new URL(input);
  let message = `${String(timestamp)}${init.method || 'GET'}${url.pathname}${url.search}`;
  if (init.body) {
    message += init.body;
  }

  const privateKey = 'c6fd6dda24060f5269b73459da5fa0978412458bc8f09d7ef5db5d0d3a7aa1f4';

  const orderlySignature = await signAsync(encoder.encode(message), privateKey);

  console.log('sig', orderlySignature)

  console.log('acctId', orderlyAccountId)
  console.log('orderlyKey', orderlyKey)

  console.log(timestamp)

  console.log('orderlySignature:', Buffer.from(orderlySignature).toString('base64url'),);

  return fetch(input, {
    headers: {
      'Content-Type':
        init.method !== 'GET' && init.method !== 'DELETE'
          ? 'application/json'
          : 'application/x-www-form-urlencoded',
      'orderly-timestamp': String(timestamp),
      'orderly-account-id': orderlyAccountId,
      'orderly-key': orderlyKey,
    //   'orderly-key': `ed25519:${encodeBase58(await getPublicKeyAsync(privateKey))}`,
      'orderly-signature': Buffer.from(orderlySignature).toString('base64url'),
      ...init.headers
    },
    ...init
  });
}

// Kline request function
async function getKline(orderlyAccountId, privateKey, symbol, type, limit = 500) {
  const baseUrl = 'https://api-evm.orderly.org/v1/kline';
  const url = new URL(baseUrl);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('type', type);
  url.searchParams.append('limit', limit.toString());

  return await signAndSendRequest(orderlyAccountId, privateKey, url, {
    method: 'GET',
  });
}

function hexToBytes(hex) {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2); // Remove '0x' prefix
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function main() {
  const orderlyAccountId = '0x4a7e6695042f392f4b4dabdab0af1ba0779386ea908fa2422ca3f51d34df6ca3';

  const orderlyKey = 'ed25519:7v7tkEsnt4pSdXUXd8ywiTDvtBW5sb16q3PvG9kWgGuk';
  
  const symbol = 'PERP_ETH_USDC'; // Example symbol
  const type = '5m'; // Example type (1 minute)
  
  try {
    const response = await getKline(orderlyAccountId, orderlyKey, symbol, type);
    const data = await response.json();
    console.log(data);
    console.log(JSON.stringify(data, null, 2));

    // Save the data to a JSON file
    fs.writeFileSync('kline_data.json', JSON.stringify(data, null, 2));
    console.log('Data successfully saved to kline_data.json');

  } catch (error) {
    console.error('Error fetching Kline data:', error);
  }
}

main().catch(console.error);



// orderlyKey testnet = 'ed25519:3ufN5cNa858xbEb18DZg9yTCKGTZAERqsNFM4RjdrYH5';

// orderlyKey mainnet ed25519:7v7tkEsnt4pSdXUXd8ywiTDvtBW5sb16q3PvG9kWgGuk

// private key: 1b2e21b22bc86e27c299f29e03e1f9d65d10ffb1bc302f40062f9d37eb03a527

// private key mainnet: c6fd6dda24060f5269b73459da5fa0978412458bc8f09d7ef5db5d0d3a7aa1f4

// acctId: 0x80ce6ff3f35f000a763198c4da27c79930f4a383f658ae86d6f740b73ee80ef3

// mainnet acctId: 0x4a7e6695042f392f4b4dabdab0af1ba0779386ea908fa2422ca3f51d34df6ca3



// Binance api Key: iF4KEm7iocx2aky9fUtdq55edpG1rfPnbXoWy2RhLrN4iqTULpboR29gse4qCQfV


// Binance api Secret: EdKsl70xTHIpHfZECkWEo2gbieATGdaj7KeFKjHpqRDIuyPlzub4BDMU3S6Sof09


// empyreal acctID for testnet: 0x113012ba089670e09f15d2de23bd3029c97bd37ff5681e89ca5107773aa57dac


// Empyreal Wallet Add: 0xEE48C329AAEB8Db0d2b4C577d36F69aAF51AbB69
// Empyreal Wallet Private Key: 0x30e6cd50e6f7110d63e1fd83a68d0a46a8d11932635fae36642a0c68ef72fe28
// Empyreal Wallet Account: 0xeffefc0efde28f5230a962c97a9e6badbae46c407c75aa4749063c5bebbe909b
// Empyreal Orderly Key: ed25519:FQjHTZaNX3iNGPnPAAYTG1SzRX3CZRtoLCDfMxvEUMMV
//
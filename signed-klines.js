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
# NodeJS Kraken.com API Typescript

NodeJS Client Library for the Kraken (kraken.com) API

This is an asynchronous node javascript/typescript client for the kraken.com API. It exposes all the API methods found [here](https://www.kraken.com/help/api) through the `api` method.

## Installation

```bash
npm install kraken-com-api-node-ts
```

## Setup

You need to save your keys in a `.env` file

```env
API_KEY=yourapikey
API_SECRET=asecret
OPT_KRAKEN=123456
```

## Example Usage

```javascript
import getApi from 'kraken-com-api-node-ts';

// without 2fa
const api = getApi();
// or with 2fa
const api = getApi('345690');

(async () => {
  // Display user's balance
  console.log(await api('Balance'));
  // Get Ticker Info
  console.log(await api('Ticker', { pair : 'XXBTZUSD' }));
})();
```

## Request Structure

```text
 header:
   API-Key = API key
   API-Sign = Message signature using HMAC-SHA512 of (URI path + SHA256(nonce + POST data)) and base64 decoded secret API key
   User-Agent = kraken-com-api-node-ts/1.0.0 (NodeJS, Typescript, Repo - https://github.com/gbili/kraken-com-api-node-ts)
 timeout:
    The client can send a request with a timeout (in seconds), that will start a countdown timer
    which will cancel *all* client orders when the timer expires
 body:
   nonce = always increasing unsigned 64 bit integer
   otp = two-factor password (if two-factor enabled, otherwise not required)
 response:
   error = array of error messages in the format of:
     <char-severity code (E|W)><string-error category>:<string-error type>[:<string-extra info>]
   result = result of API call (may not be present if errors occur)
```

## Credits

I forked [Robert Myers](https://github.com/nothingisdead/kraken-api) kraken api client to produce the typescript version.

Robert Myers BTC donation address: 12X8GyUpfYxEP7sh1QaU4ngWYpzXJByQn5

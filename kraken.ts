import 'dotenv/config';
import got, { OptionsOfTextResponseBody } from 'got';
import crypto from 'crypto';
import qs from 'qs';

type MethodPrivacyPublic = 'public';
type MethodPrivacyPrivate = 'private';
type PublicMethodName = 'Time'| 'Assets'| 'AssetPairs'| 'Ticker'| 'Depth'| 'Trades'| 'Spread'| 'OHLC';
type PrivateMethodName = 'Balance'| 'TradeBalance'| 'OpenOrders'| 'ClosedOrders'| 'QueryOrders'| 'TradesHistory'| 'QueryTrades'| 'OpenPositions'| 'Ledgers'| 'QueryLedgers'| 'TradeVolume'| 'AddOrder'| 'CancelOrder'| 'DepositMethods'| 'DepositAddresses'| 'DepositStatus'| 'WithdrawInfo'| 'Withdraw'| 'WithdrawStatus'| 'WithdrawCancel'| 'GetWebSocketsToken';
type MethodSet<P, N> = {
  privacy: P;
  methodNames: N[];
};
type PublicMethodSet = MethodSet<MethodPrivacyPublic, PublicMethodName>;
type PrivateMethodSet = MethodSet<MethodPrivacyPrivate, PrivateMethodName>;
type AllowedMethodSet = PublicMethodSet | PrivateMethodSet;
type MethodType = AllowedMethodSet['privacy'] | undefined;
type RequestBodyParams = {
  otp?: string;
  nonce: number;
  [k: string]: string | number | undefined;
};
interface PublicRequestHeaders {
  'API-Key': string;
  'User-Agent': string;
};
interface PrivateRequestHeaders extends PublicRequestHeaders {
  'API-Sign': string;
}
type KrakenResponse = {
  error: string[];
  result: undefined;
} | {
  error: undefined;
  result: any;
}

const API_HOST = `https://api.kraken.com`;
const API_VERSION = 0;
const timeout = 5000;
const userAgent = 'kraken-com-api-node-ts/1.0.0 (NodeJS, Typescript, Repo - https://github.com/gbili/kraken-com-api-node-ts)';

const methodSets: AllowedMethodSet[] = [
  {
    privacy: 'public',
    methodNames: ['Assets', 'AssetPairs', 'Depth', 'OHLC', 'Ticker', 'Time', 'Trades', 'Spread'],
  },
  {
    privacy: 'private',
    methodNames: ['AddOrder', 'Balance', 'DepositAddresses', 'DepositMethods', 'DepositStatus', 'ClosedOrders', 'CancelOrder', 'GetWebSocketsToken', 'Ledgers', 'OpenOrders', 'OpenPositions', 'QueryOrders', 'QueryTrades', 'QueryLedgers', 'TradeBalance', 'TradesHistory', 'TradeVolume', 'Withdraw', 'WithdrawCancel', 'WithdrawInfo',  'WithdrawStatus'],
  },
];

function isPublicMethodSet(s: AllowedMethodSet): s is PublicMethodSet {
  return s.privacy === 'public';
}

function getMethodType(m: any): MethodType {
  return methodSets.reduce((p: MethodType, methodSet: AllowedMethodSet) => {
    if (isPublicMethodSet(methodSet)) {
      const { privacy, methodNames } = methodSet;
      return (methodNames.some(n => n === m) && privacy) || p
    } else {
      const { privacy, methodNames } = methodSet;
      return (methodNames.some(n => n === m) && privacy) || p
    }
  }, undefined);
}

function getFullBodySignature(path: string, requestBodyParams: RequestBodyParams, secret: string) {
  const postData = qs.stringify(requestBodyParams);
  const sign = crypto.createHmac('sha512', Buffer.from(secret, 'base64')).update(
    path + crypto.createHash('sha256').update(requestBodyParams.nonce + postData).digest(), 'binary'
  );
  return sign.digest('base64');
};

async function makeRequest(url: string, headers: Record<keyof (PublicRequestHeaders | PrivateRequestHeaders), string | string[]>, requestBodyParams: RequestBodyParams, timeout: number) {

  const options: OptionsOfTextResponseBody = {
    headers,
    method : 'POST',
    timeout,
    body   : qs.stringify(requestBodyParams),
  };

  const { body } = await got(url, options);
  const response: KrakenResponse = JSON.parse(body);

  if(response.error && response.error.length > 0) {
    const errors = response.error
      .filter(e => e.startsWith('E'))
      .map(e => e.substr(1));

    if(errors.length <= 0) {
      throw new Error("Kraken API returned an unknown error");
    }

    throw new Error(errors.join('\n'));
  }

  return response.result;
};

export const getApi = (otpParam?: string) => {
  const key: string | undefined = process.env.API_KEY;
  const secret: string | undefined = process.env.API_SECRET;
  if (key === undefined || secret === undefined) {
    throw new Error('Could not find or load .env.API_KEY or .env.API_SECRET');
  }

  const otp = (otpParam && otpParam) || process.env.OTP_KRAKEN;

  return async (methodName: PublicMethodName | PrivateMethodSet, methodParams: { [k: string]: any; } = {}) => {
    const methodType = getMethodType(methodName);
    if(methodType === undefined) {
      throw new Error(methodName + ' is not a valid API method.');
    }

    const path = `/${API_VERSION}/${methodType}/${methodName}`;

    const methodParamsWithSecurity = {
      ...methodParams,
      nonce: Date.now() * 1000,
    };

    const bodyParams = otp
      ? {
          ...methodParamsWithSecurity,
          otp,
        }
      : methodParamsWithSecurity;

    const privateMethodRequestHeaders = (methodType === 'private')
      ? {
        'API-Sign' : getFullBodySignature(path, bodyParams, secret),
      }
      : {};

    const headers = {
      'API-Key': key,
      'User-Agent': userAgent,
      ...privateMethodRequestHeaders,
    }

    const url = `${API_HOST}/${path}`;

    try {
      return await makeRequest(url, headers, bodyParams, timeout);
    } catch (e) {
      throw e;
    }
  }
}

export default getApi;
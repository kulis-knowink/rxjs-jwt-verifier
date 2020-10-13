import type { JWK } from 'jwk-to-pem';

export interface Config {
  region: string;
  appClientId?: string;
  userPoolId: string;
  issuer: string;
}

export type JWKwithKID = JWK & {kid: string}

export interface DecodedHeader {
  alg: string;
  kid: string;
  typ: string;
}

export interface Key {
  [propName: string]: string;
  typ: 'RSA';
}

export interface JWKs {
  keys: JWKwithKID[];
}


export interface IdToken {
  [propName: string]: string | boolean
}

export interface Payload {
  idToken: string;
  config: Config;
  decodedHeader?: DecodedHeader;
  jwk?: JWKs;
  decoded?: IdToken;
  appClientId: string,
  userPoolId: string,
  issuer: string
}

export interface Decoded {
  aud: string;
  iss: string;
  token_use: string;
}

export interface SimpleHeader {
  idToken: string;
}

export interface SimpleRequest {
  headers: SimpleHeader;
}

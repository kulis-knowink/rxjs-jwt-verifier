import { of, from, pipe, Observable } from 'rxjs';
import { map, tap, catchError, merge, mapTo, mergeMap, switchMap } from 'rxjs/operators';
import decode from 'jwt-decode';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import type { JWK } from 'jwk-to-pem';
import type { Algorithm } from 'jsonwebtoken';
import { ajax } from 'rxjs/ajax';

import { HttpMiddlewareEffect, HttpRequest } from '@marblejs/core';
import { Payload, Config, DecodedHeader, Key, JWKs, IdToken, Decoded, JWKwithKID } from './interfaces'


const decodeIDToken = (payload: Payload): any => {
  const {  idToken,  } = payload;

  let decodedHeader;
  try {
    decodedHeader = decode(idToken, { header: true});
  } catch (e) {
    throw new Error('Cannot decode token')
  }
  return {
    ...payload,
    decodedHeader
  }
}

const decodeAccessToken = (payload: Payload): any => {
  const {  accessToken,  } = payload;

  let decodedHeader;
  try {
    decodedHeader = decode(accessToken, { header: true});
  } catch (e) {
    throw new Error('Cannot decode token')
  }
  return {
    ...payload,
    decodedHeader
  }
}

const confirmIDStructure = (payload: Payload): any => {
  const { idToken } = payload;
  if(!idToken || idToken.split('.').length !== 3){
    throw new Error('Invalid Token Structure')
  }
  return payload;
}

const confirmAccessStructure = (payload: Payload): any => {
  const { accessToken } = payload;
  if(!accessToken || accessToken.split('.').length !== 3){
    throw new Error('Invalid Token Structure')
  }
  return payload;
}

const matchKID = (payload: Payload): any => {
  const { decodedHeader: { kid }, jwk: { keys }} = payload;
  const match = !!keys.find(key => key.kid === kid);
  if(!match) throw new Error('Key IDs do not match')
  return payload
}

const verifyIDSignature = (payload: Payload): any => {
  const { idToken, jwk: { keys }, decodedHeader: { alg, kid } } = payload;
  var pem = jwkToPem(<JWK>keys.find(key => key.kid === kid));
  let decoded;

  try {
    decoded = jwt.verify(idToken, pem, { algorithms: [<Algorithm>alg] })
  } catch (e) {
    if(e.message === 'jwt expired') throw new Error()
    throw new Error('Invalid Signature')
  }
  return {
    ...payload,
    decoded
  }
}

const verifyAccessSignature = (payload: Payload): any => {
  const { accessToken, jwk: { keys }, decodedHeader: { alg, kid } } = payload;
  var pem = jwkToPem(<JWK>keys.find(key => key.kid === kid));
  let decoded;

  try {
    decoded = jwt.verify(accessToken, pem, { algorithms: [<Algorithm>alg] })
  } catch (e) {
    if(e.message === 'jwt expired') throw new Error()
    throw new Error('Invalid Signature')
  }
  return {
    ...payload,
    decoded
  }
}


const wrongAud = ({appClientId , decoded: { aud }}: { appClientId: string , decoded: Decoded}) => appClientId !== aud;
const wrongISS = ({issuer , decoded: { iss }}) => iss !== issuer;
const wrongTokenUse = ({decoded: {token_use }}, type) => token_use !== type

const validateIDClaims = (payload: any): any => {
  if(wrongAud(payload)) throw new Error('Wrong Audience')
  if(wrongISS(payload)) throw new Error('Wrong Issuer')
  if(wrongTokenUse(payload , 'id')) throw new Error("Wrong Token Use")
  return payload
}

const validateAccessClaims = (payload: any): any => {
  if(wrongISS(payload)) throw new Error('Wrong Issuer')
  if(wrongTokenUse(payload, 'access')) throw new Error("Wrong Token Use")
  return payload
}



export const validateIDToken = payload => {
  try {
    payload = confirmIDStructure(payload);
    payload = decodeIDToken(payload);
    payload = matchKID(payload);
    payload = verifyIDSignature(payload);
    payload = validateIDClaims(payload);
  } catch (e) {
    console.error(e);
    return false;
  }

  return true
}

export const validateAccessToken = payload => {
  try {
    payload = confirmAccessStructure(payload);
    payload = decodeAccessToken(payload);
    payload = matchKID(payload);
    payload = verifyAccessSignature(payload);
    payload = validateAccessClaims(payload);
  } catch (e) {
    console.error(e);
    return false;
  }

  return true
}

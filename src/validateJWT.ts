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


const decodeToken = (payload: Payload): any => {
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

const confirmStructure = (payload: Payload): any => {
  const { idToken } = payload;
  if(idToken.split('.').length !== 3){
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

const verifySignature = (payload: Payload): any => {
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


const wrongAud = ({appClientId , decoded: { aud }}: { appClientId: string , decoded: Decoded}) => appClientId !== aud;
const wrongISS = ({issuer , decoded: { iss }}) => iss !== issuer;
const wrongTokenUse = ({decoded: {token_use }}) => token_use !== 'id'

const validateClaims = (payload: any): any => {
  if(wrongAud(payload)) throw new Error('Wrong Audience')
  if(wrongISS(payload)) throw new Error('Wrong Issuer')
  if(wrongTokenUse(payload)) throw new Error("Wrong Token Use")
  return payload
}


export default payload => {
  try {
    payload = confirmStructure(payload);
    payload = decodeToken(payload);
    payload = matchKID(payload);
    payload = verifySignature(payload);
    payload = validateClaims(payload);
  } catch (e) {
    console.error(e);
    return false;
  }

  return true
}

import { of, from } from 'rxjs';
import { pipe, map, tap, catchError, merge, mapTo, mergeMap } from 'rxjs/operators';
import decode from 'jwt-decode';
import axios from 'axios-observable';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

const decodeToken = map(payload => {
  const {  idToken,  } = payload;

  let decodedHeader;
  try {
    decodedHeader = decode(idToken, { header: true});
  } catch (e) {
    throw new Error('Invalid Token')
  }
  return {
    ...payload,
    decodedHeader
  }
})

const confirmStructure = map(payload => {
  const { idToken } = payload;
  if(idToken.split('.').length !== 3){
    throw new Error('Invalid Structure');
  }
  return payload;
})

const matchKID = map(payload => {
  const { decodedHeader: { kid }, jwk: { keys }} = payload;
  const match = !!keys.find(key => key.kid === kid);
  if(!match) throw new Error('Non Matching KIDs')
  return payload
})

const getJWK = (region, userPoolId) => {
  const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
  return axios.get(url)
}

const verifySignature = map(payload => {
  const { idToken, jwk: { keys }, decodedHeader: { alg, kid } } = payload;
  var pem = jwkToPem(keys.find(key => key.kid === kid));
  let decoded;

  try {
    decoded = jwt.verify(idToken, pem, { algorithms: [alg] })
  } catch (e) {
    if(e.message === 'jwt expired') throw new Error('Token is expired')
    throw new Error('Invalid Signature')
  }
  return {
    ...payload,
    decoded
  }
})

const wrongAud = ({appClientId, decoded: { aud }}) => appClientId !== aud;
const wrongISS = ({issuer, decoded: { iss }}) => iss !== issuer;
const wrongTokenUse = ({decoded: { token_use }}) => token_use !== 'id'

const validateClaims = map(payload => {
  if(wrongAud(payload)) throw new Error('Wrong AUD')
  if(wrongISS(payload)) throw new Error('Wrong ISS')
  if(wrongTokenUse(payload)) throw new Error("Wrong Token Use")
  return payload
})

export const verify = (idToken, { region, userPoolId, appClientId, issuer}) => of({idToken, appClientId, userPoolId, issuer})
  .pipe(
    confirmStructure,
    decodeToken,
    mergeMap(payload => getJWK(region, userPoolId).pipe(map(response => ({...payload, jwk: response.data})))),
    matchKID,
    verifySignature,
    validateClaims,
    map(({decoded}) => decoded)
  )

import { validateJWT } from './validateJWT'
import { Observable } from 'rxjs'
import axios from 'axios';
import { ajax } from 'rxjs/ajax';
import jwt from 'jsonwebtoken';
const njwt = require('njwt');
import decode from 'jwt-decode';
import jwkToPem from 'jwk-to-pem';
import type { JWK } from 'jwk-to-pem';

const jwk = {
  "keys": [{
    "alg":"RS256",
    "e":"AQAB",
    "kid":"foobar",
    "kty":"RSA",
    "n":"pNfbP9jNeoTEgjkiea40muoPsLAf_KUZfnBT0HrjTZZlRTDbTHSBWHTnPs4bLQoIK9YMMnS6L_77pcWSAujwedsRgcP30cGiJLbQZbFuI-Gmyc1fGDRF1sKpwVwU-xrWgmSnioI_rhZK0L_4s3BzU8G69nFGx9XepLbAna5aV-ng-Ly9JC8Kj0RdGCTWQybfvIlAkG2_riEL3leSKWinlCLav1sJgVUqQj2Itke6hJi531Zf1NTLZk-NoS9-1nnT8gUUyNUzFUIB9LkqyR59qsCVXe-7IK1hFxxFH1p5z8tMpYiAMgbTPmxv29oiJ211NUNpKVytZNiP9gBiwoc-Pw",
    "use":"sig"
  }]
}

const jwkWithDifferentKID ={
  "keys":[{
    "alg":"RS256",
    "e":"AQAB",
    "kid":"not foobar",
    "kty":"RSA",
    "n":"pNfbP9jNeoTEgjkiea40muoPsLAf_KUZfnBT0HrjTZZlRTDbTHSBWHTnPs4bLQoIK9YMMnS6L_77pcWSAujwedsRgcP30cGiJLbQZbFuI-Gmyc1fGDRF1sKpwVwU-xrWgmSnioI_rhZK0L_4s3BzU8G69nFGx9XepLbAna5aV-ng-Ly9JC8Kj0RdGCTWQybfvIlAkG2_riEL3leSKWinlCLav1sJgVUqQj2Itke6hJi531Zf1NTLZk-NoS9-1nnT8gUUyNUzFUIB9LkqyR59qsCVXe-7IK1hFxxFH1p5z8tMpYiAMgbTPmxv29oiJ211NUNpKVytZNiP9gBiwoc-Pw",
    "use":"sig"
  }]
}

const getPayload = {
  data: jwk,
}

const getBadPayload = {
  data: jwkWithDifferentKID
}

const region = 'us-east-1';
const userPoolId = 'us-east-1_xysK5skkd'
const appClientId = '66a3l3ok3li0bkh3v906q86jl6'
const issuer = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`

const now = Math.floor(new Date().getTime() / 1000);
const plus5min = new Date(now * 1000 + (5 * 60 * 1000)).getTime();

const claims = {
  aud: appClientId,
  token_use: 'id'
}

const pem = jwkToPem( <JWK>jwk.keys[0])
const idToken = njwt.create(claims,pem)
  .setHeader('kid', jwk.keys[0].kid)
  .setIssuedAt(now)
  .setExpiration(plus5min)
  .setIssuer(issuer)
  .setSubject(appClientId)
  .compact()

const config = {
  region,
  userPoolId,
  appClientId,
  issuer
}

/*

  Get jwk, cachce limits its ttl. download a new jwk when that is expired to save downloads
  Pass jwk in with verify
  verify return true/false
*/

describe('validateJWT tests', () => {

  const payload = {
    ...config,
    jwk,
    idToken
  }

  it('should validate', () => {
    const valid = validateJWT(payload)
    expect(valid).toBe(true);
  })

  it('should fail when invalid token - confirmStructure', async () => {
    const valid = validateJWT({...payload, idToken: 'abc'})
    expect(valid).toBe(false);
  })

  it('should fail when invalid token - decodedHeader', async () => {
    const valid = validateJWT({...payload, idToken: 'a.b.c'})
    expect(valid).toBe(false);
  })

  it('should fail when not matching kid', async () => {
    const valid = validateJWT({...payload, jwk: jwkWithDifferentKID})
    expect(valid).toBe(false);
  })

  it('should fail when bad signature', async () => {
    const valid = validateJWT({...payload, idToken: payload.idToken + 'bad juju'})
    expect(valid).toBe(false);
  })

  it('should fail when is expired', async () => {
    const idToken = njwt.create(claims,pem)
      .setHeader('kid', jwk.keys[0].kid)
      .setIssuedAt(now)
      .setExpiration(now - 1)
      .setIssuer(issuer)
      .setSubject(appClientId)
      .compact()
    const valid = validateJWT({...payload, idToken})
    expect(valid).toBe(false);
  })

  it('should fail when wrong AUD', async () => {

    const claims = {
      aud: 'foobar',
      token_use: 'id'
    }
    const idToken = njwt.create(claims,pem)
      .setHeader('kid', jwk.keys[0].kid)
      .setIssuedAt(now)
      .setExpiration(plus5min)
      .setIssuer(issuer)
      .setSubject(appClientId)
      .compact()
    const valid = validateJWT({...payload, idToken})
    expect(valid).toBe(false);
  })

  it('should fail when wrong ISS', async () => {
    const idToken = njwt.create(claims,pem)
      .setHeader('kid', jwk.keys[0].kid)
      .setIssuedAt(now)
      .setExpiration(plus5min)
      .setIssuer('fppbar')
      .setSubject(appClientId)
      .compact()
    const valid = validateJWT({...payload, idToken})
    expect(valid).toBe(false);
  })

    it('should fail when wrong token use', async () => {
      const claims = {
        aud: appClientId,
        token_use: 'not id'
      }

      const idToken = njwt.create(claims,pem)
        .setHeader('kid', jwk.keys[0].kid)
        .setIssuedAt(now)
        .setExpiration(plus5min)
        .setIssuer(issuer)
        .setSubject(appClientId)
        .compact()
      const valid = validateJWT({...payload, idToken})
      expect(valid).toBe(false);
    })
})

import { verify } from './index';
jest.mock('axios')
import axios from 'axios';
import { ajax } from 'rxjs/ajax';
import jwt from 'jsonwebtoken';
import njwt from 'njwt';
import decode from 'jwt-decode';
import secureRandom from 'secure-random';
import jwkToPem from 'jwk-to-pem';

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

const jwkWithDifferentKID = {
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

const pem = jwkToPem(jwk.keys[0])
const token = njwt.create(claims,pem)
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

describe('index tests', () => {
  describe('verify', () => {
    beforeEach(() => {
      axios.get.mockImplementation(() => Promise.resolve(getPayload));
      axios.default.CancelToken.source.mockImplementation(() => Math.random())
    })
    it('should verify', async () => {
      let res;
      const expected = decode(token);
      await verify(token, config).subscribe(response => res = response)
      expect(res).toEqual(expected)
    })

    it('should fail when invalid token - confirmStructure', async () => {
      let error;
      await verify('abc', {}).subscribe(() => {}, err => error = err)
      expect(/Invalid Structure/.test(error)).toBe(true);
    })

    it('should fail when invalid token - decodedHeader', async () => {
      let error;
      await verify('a.b.c', {}).subscribe(() => {}, err => error = err)
      expect(/Invalid Token/.test(error)).toBe(true);
    })

    it('should fail when not matching kid', async () => {
      axios.get.mockImplementation(() => Promise.resolve(getBadPayload));
      let error;
      await verify(token, config).subscribe(() => {}, err => error = err)
      expect(/Non Matching KIDs/.test(error)).toBe(true);
    })

    it('should fail when bad signature', async () => {
      let error;
      await verify(token+ 'bad juju', config).subscribe(() => {}, err => error = err)
      expect(/Invalid Signature/.test(error)).toBe(true);
    })

    it('should fail when is expired', async () => {
      let error;
      const token = njwt.create(claims,pem)
        .setHeader('kid', jwk.keys[0].kid)
        .setIssuedAt(now)
        .setExpiration(now - 1)
        .setIssuer(issuer)
        .setSubject(appClientId)
        .compact()
      await verify(token, config).subscribe(() => {}, err => error = err)
      expect(/Token is expired/.test(error)).toBe(true);
    })

    it('should fail when wrong AUD', async () => {
      let error;

      const claims = {
        aud: 'foobar',
        token_use: 'id'
      }

      const token = njwt.create(claims,pem)
        .setHeader('kid', jwk.keys[0].kid)
        .setIssuedAt(now)
        .setExpiration(plus5min)
        .setIssuer(issuer)
        .setSubject(appClientId)
        .compact()
      await verify(token, config).subscribe(() => {}, err => error = err)
      expect(/Wrong AUD/.test(error)).toBe(true);
    })

    it('should fail when wrong ISS', async () => {
      let error;
      const token = njwt.create(claims,pem)
        .setHeader('kid', jwk.keys[0].kid)
        .setIssuedAt(now)
        .setExpiration(plus5min)
        .setIssuer('fppbar')
        .setSubject(appClientId)
        .compact()
      await verify(token, config).subscribe(() => {}, err => error = err)
      expect(/Wrong ISS/.test(error)).toBe(true);
    })

    it('should fail when wrong token use', async () => {
      let error;

      const claims = {
        aud: appClientId,
        token_use: 'not id'
      }

      const token = njwt.create(claims,pem)
        .setHeader('kid', jwk.keys[0].kid)
        .setIssuedAt(now)
        .setExpiration(plus5min)
        .setIssuer(issuer)
        .setSubject(appClientId)
        .compact()
      await verify(token, config).subscribe(() => {}, err => error = err)
      expect(/Wrong Token Use/.test(error)).toBe(true);
    })

  })
})

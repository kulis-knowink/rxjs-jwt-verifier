import { validateIDToken, validateAccessToken } from './validateJWT'
import { map, mergeMap, mapTo, tap, switchMap } from 'rxjs/operators';
import { of, throwError, Observable } from 'rxjs';
import { HttpMiddlewareEffect, HttpError, HttpStatus, HttpRequest } from '@marblejs/core';
import { initJWK } from './updateJWK';
import decode from 'jwt-decode';

interface Config {
  region: string;
  appClientId: string;
  userPoolId: string;
  issuer: string;
  jwkUrl: string;
  expiresIn: number;
}


export const isAuthenticated = (config, getCurrentJWK, req) => {
  let payload = {
    ...config,
    jwk: getCurrentJWK(),
    idToken: req.headers?.idtoken
  }
  return validateIDToken(payload)
};



export const authenticate$ =  (config: Config): HttpMiddlewareEffect => {

  const { jwkUrl, expiresIn } = config;

  const { getJWK, updateJWK } = initJWK(jwkUrl, expiresIn)
  return (req$: any): Observable<HttpRequest> => req$.pipe(
    updateJWK,
    mergeMap(req => !isAuthenticated(config, getJWK, req) ? throwError(new HttpError('Not Authorized', HttpStatus.UNAUTHORIZED)) : of(req))
  )
}

/* deprecated */
export const authorize = (allowedScopes: string[]): any =>

  mergeMap((req: any) => of(req))

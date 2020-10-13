import { validateJWT } from './validateJWT'
import { map, mergeMap, mapTo, tap, switchMap } from 'rxjs/operators';
import { of, throwError, Observable } from 'rxjs';
import { HttpMiddlewareEffect, HttpError, HttpStatus, HttpRequest } from '@marblejs/core';
import { initJWK } from './updateJWK';

interface Config {
  region: string;
  appClientId: string;
  userPoolId: string;
  issuer: string;
  jwkUrl: string;
  expiresIn: number;
}



export const isAuthorized = (config, getCurrentJWK, req) => {
  let payload = {
    ...config,
    jwk: getCurrentJWK(),
    idToken: req.headers?.idtoken
  }
  return validateJWT(payload)
};

export const authenticate$ =  (config: Config): HttpMiddlewareEffect => {

  const { jwkUrl, expiresIn } = config;

  const { getJWK, updateJWK } = initJWK(jwkUrl, expiresIn)

  return (req$: any): Observable<HttpRequest> => req$.pipe(
    updateJWK,
    tap(console.log),
    mergeMap(req => !isAuthorized(config, getJWK, req) ? throwError(new HttpError('Not Authorized', HttpStatus.UNAUTHORIZED)) : of(req))
  )
}

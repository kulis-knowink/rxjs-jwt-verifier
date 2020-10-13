import validateJWT from './validateJWT'
import acquireJWK from './acquireJWK'
import { map, mergeMap, mapTo, tap, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { HttpMiddlewareEffect, HttpError, HttpStatus, HttpRequest } from '@marblejs/core';

interface Config {
  region: string;
  appClientId: string;
  userPoolId: string;
  issuer: string;
}


export const isAuthorized = (config, getCurrentJWK, req) => {
  let payload = {
    ...config,
    jwk: getCurrentJWK(),
    idToken: req.headers?.idtoken
  }
  return validateJWT(payload)
};

export default (config: Config, getCurrentJWK: any): HttpMiddlewareEffect => req$ =>
  req$.pipe(
    mergeMap(req => !isAuthorized(config, getCurrentJWK, req) ? throwError(new HttpError('Not Authorized', HttpStatus.UNAUTHORIZED)) : of(req))
  )

import { validateJWT } from './validateJWT'
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

interface Scopes {
  [index: number]: string;
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
    mergeMap(req => !isAuthorized(config, getJWK, req) ? throwError(new HttpError('Not Authorized', HttpStatus.UNAUTHORIZED)) : of(req))
  )
}

export const authorize = (allowedScopes: Scopes): any => mergeMap(req => {
      const {
        headers: {
          accesstoken
        }
      } = req;

      const {
        scope
      } = decode(accesstoken)
      const scopes = scope.split(' ')

      console.log(allowedScopes, scopes)
      let isAuthorized = false;
      const authorized = allowedScopes.map(allowed => {
        if(isAuthorized) return;
        isAuthorized = !!scopes.find(scope => scope === allowed)
      })

      return isAuthorized ? of(req) : throwError({ response: { status: 403 }})
    })

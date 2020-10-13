import { acquireJWK } from './acquireJWK';
import { switchMap, map, tap, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { JWKs } from './interfaces';

const TWENTY_MINUTES = 20 * 60 * 1000;

interface Response {
  jwk: JWKs
}

export const initJWK = (jwkUrl: string, expiresIn = TWENTY_MINUTES) => {

  let jwk;


  const setJWK = next => jwk = next;

  const getJWK = () => jwk;
  const jwkBuilder$ = acquireJWK(jwkUrl, expiresIn);
  jwkBuilder$().subscribe(response => setJWK(response.jwk));

  const updateJWK$ = req$ =>
    req$.pipe(
      switchMap(req => jwkBuilder$().pipe(
        map((response: Response) => {
          setJWK(response.jwk)
          return of([])
        }),
        mergeMap(() => of(req))
      )),
    )


  return {
      setJWK,
      getJWK,
      updateJWK$
  }

}

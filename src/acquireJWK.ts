import { Observable, interval } from 'rxjs'
import { map, tap } from 'rxjs/operators';
import axios from 'axios';


const MINUTES = 60 * 1000;
const TWENTY_MINUTES = MINUTES * 20;

export const acquireJWK = (url, ttl = TWENTY_MINUTES) => {
  let JWK;
  let expiresAt = 0
  let time = ttl;
  return () => Observable.create(observer => {
    if(!JWK || expiresAt < Date.now()){
      axios.get(url).then(response => {
        const {
          data,
        } = response;
        JWK = data;
        expiresAt = Date.now() + time;
        observer.next({jwk: JWK});
      }).catch(error => observer.error(error))
    }

    else {
      observer.next({jwk: JWK});
    }
  })
}

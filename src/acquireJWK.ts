import { Observable, interval } from 'rxjs'
import { map, tap } from 'rxjs/operators';
import axios from 'axios';

export const hello = () => 'hello'


export const test = (val = 0) =>  {
  let value = 0;
  let time;
  return {
    start: () => interval(100).pipe(
      map(x => {
        if(!value){
          value = 1;
          time = Date.now();
        }

        else if(time + 500 < Date.now()){
          value++;
          time = Date.now()
        }
        return value
      })
    )
  }
}
const MINUTES = 60 * 1000;
const TWENTY_MINUTES = MINUTES * 20;

export default (url, ttl = TWENTY_MINUTES) => {
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

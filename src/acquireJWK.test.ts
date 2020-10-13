import { acquireJWK } from './acquireJWK';
import axios from 'axios';

const region = 'us-east-1';
const userPoolId = 'us-east-1_xysK5skkd'
const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`

jest.mock('axios');

describe('acquire jwk tests', () => {
  let observerBuilder = acquireJWK(url);
  let counter = 0;
  let mockedAxios;

  beforeEach(() => {
    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.get.mockImplementation(() => {
      counter++;
      return Promise.resolve({data: {keys: [{count: counter}]}})
    })
  })

  it('should get a JWK', async (done) => {
    const jwk$ = observerBuilder()
    let returned;
    await jwk$.subscribe(response => {
      const [ key ] = response.jwk.keys
      returned = key;
      done()
    })

    expect(returned.count).toEqual(1)

  })

  it('should return a JWK when known and not expired', async (done) => {
    const jwk$ = observerBuilder()
    let returned;
    await jwk$.subscribe(response => {
      const [ key ] = response.jwk.keys
      returned = key;
      done()
    })

    expect(returned.count).toEqual(1)
  })

  it('should get a new JWK when expired', async (done) => {
    const builder = acquireJWK(url, -1);
    const jwk$ = builder();
    let returned;
    await jwk$.subscribe(response => {
      const [ key ] = response.jwk.keys
      returned = key;
      done()
    })

    expect(returned.count).toEqual(2)
    const next$ = builder();
    await next$.subscribe(response => {
      const [ key ] = response.jwk.keys
      returned = key;
      done()
    })
    expect(returned.count).toEqual(3)
  })
})


/*

{
        data: { keys: [ {}, {} ] },
        headers: {
          'cache-control': 'public, max-age=86400'
        },

      }

*/

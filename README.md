serialized# RXJS JWT Verifier

A rxjs middleware for marblejs that authenticates JWT tokens.

## Usage

### Download

`npm i --save @knowink-dev/rxjs-jwt-verifier`

### Applying middleware

To verify a JWT is simple. Simply pass the config to the middleware and it will authenticate a JWT.

#### Config Structure

Here is an example of the config structure using AWS Cognito.


```typescript

interface Config {
  region: string;
  appClientId: string;
  userPoolId: string;
  issuer: string;
}

const region = 'region';
const userPoolId = 'user-pool-id';
const appClientId = 'app-client-id';
const jwkUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
const issuer = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`;
const TWENTY_MINUTES = 20 * 60 * 1000;

const config = {
  region,
  appClientId,
  userPoolId,
  issuer,
  jwkUrl,
  expiresIn: TWENTY_MINUTES
}

```

#### Calling the middleware

On your applied routes, in this case `/api/v1`, pass the middleware with the config

```typescript
import { combineRoutes, r } from '@marblejs/core';
import { routeOne$, routeTwo$ } from './my-api-v1-routes';
import { authenticate$ } from '@knowink-dev/rxjs-jwt-verifier'

...

const config = {
  region,
  appClientId,
  userPoolId,
  issuer,
  jwkUrl,
  expiresIn: TWENTY_MINUTES
}

const one$ = r.pipe(
  r.matchPath('/one'),
  r.matchType('GET'),
  routeOne$
);

const two$ = r.pipe(
  r.matchPath('/two'),
  r.matchType('GET'),
  routeTwo$
)

export const apiV1$ = combineRoutes('/api/v1', {
  middlewares: [
    authenticate$(config)
  ],
  effects: [
    one$,
    two$
  ]
});
```

## Middleware responses

This is an `authenticate` middleware. All UI to BFF (which this middleware is for) are simply authenticated. This means you either get your `2xx` response or a `401 UNAUTHORIZED`.

### Reasons for 401 UNAUTHORIZED

Its best to check the logs for the exact reason of a `401 UNAUTHORIZED`, but here is what is check in order.

1. Confirm the Structure - we make sure the structure of the serialized JWT follows the pattern of `a.b.c`.
2. Decode the token - we then decode the token. If the token isn't a serialized JWT token, this will fail, causing a 401.
3. Match the Key IDs - in the header of the JWT is the `KID` for that session. We then look in the `JWKs` to find that key. If that key doesn't exist, this causes a `401 UNAUTHORIZED`.
4. Verify Signature - we then verify the signature of the token against its corresponding JWK. An invalid signature will result in a `401 UNAUTHORIZED`.
5. Validate Audience - We then make sure the audience matches the `appClientId` passed in the config. An incorrect audience results in a `401 UNAUTHORIZED`
6. Validate Issuer - The tokens issuer is compared against the configs issuer. A mismatch results in a `401 UNAUTHORIZED`
7. Validate Token Use - If the token use isn't for an `id` token, this is rejected.  

# RXJS JWT Verifier

A rxjs middleware for marblejs that authenticates JWT tokens.

## Usage

### Download

`npm i --save @knowink-dev/rxjs-jwt-verifier`

### Applying middleware

To verify a JWT requires a few steps. This middleware provides that functionality. You are required to do two separate steps currently; which hopefully will be streamlined in later releases. Here are those steps.

#### Pull the JWK

The JWK is the web keys used to validate a token. These are published at well known locations and meant for public consumption. Using AWS Cognito, this is how to pull those keys in first on server start, then updated as middleware.

import { validateJWT } from './validateJWT'
import { map, mergeMap, mapTo, tap, switchMap } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { HttpMiddlewareEffect, HttpError, HttpStatus, HttpRequest } from '@marblejs/core';

export * from './updateJWK';

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

export const authenticate$ =  (config: Config, getCurrentJWK: any): HttpMiddlewareEffect => req$ =>
  req$.pipe(
    mergeMap(req => !isAuthorized(config, getCurrentJWK, req) ? throwError(new HttpError('Not Authorized', HttpStatus.UNAUTHORIZED)) : of(req))
  )






// eyJraWQiOiJRODM0VVp2QWpkNmpkUGNCbVFLTWhud2JHWldsZDAxdWdlRnh5RjZLcmxNPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiSUxqV0Q0di13U0RZVUFKZlNtdzdQdyIsInN1YiI6IjlmMzdmMDEyLTRhY2MtNDk5Ny05YTlmLTBhNTRlZDExZTkzMCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlcyI6ImludmVudG9yeVRyYWNraW5nXC9hZG1pbiwgaW52ZW50b3J5VHJhY2tpbmdcL3VzZXIsIHVzZXJNYW5hZ2VtZW50XC9hZG1pbiwgIHVzZXJNYW5hZ2VtZW50XC91c2VyIiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfeHlzSzVza2tkIiwiY29nbml0bzp1c2VybmFtZSI6IjlmMzdmMDEyLTRhY2MtNDk5Ny05YTlmLTBhNTRlZDExZTkzMCIsInVzZXJJZCI6IjEyMzQtYWJjZC01Njc4LWVmZ2giLCJhdWQiOiI2NmEzbDNvazNsaTBia2gzdjkwNnE4NmpsNiIsImV2ZW50X2lkIjoiMmU0ZTRmZDItMmM0Zi00NDlmLTgwZDYtYTg3ZDI1ZTI2ZmM3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MDI1OTM0MzgsImN1c3RvbWVySWQiOiJhYmNkLTEyMzQtZWZnaC01Njc4IiwiZXhwIjoxNjAyNTk3MDM4LCJpYXQiOjE2MDI1OTM0MzgsImVtYWlsIjoiYW50aG9ueS5rdWxpc0Brbm93aW5rLmNvbSJ9.IYj4lK7uVJ3W_M3uYN-2l8tfLod82uD0oiArGbOj8MbHxj8ve00yOqJeuuOF5KnpIMGG7Z293w9qgCtb7-J4TN58BWn_rtJaK-iChyZm5JT2C_SML3qAZdNRdovdtYSK-8qBsb2FneP8jEamQ7gVzMCM9dWZ1CMRZkdwXKxRB1LiCB1x55hOe1GrcM1Rb0aEUZ6r0L0QoeN-Io1OtzvfH1leeR5agL_cwHU1S1Tek92OAS8FcyqeoLAymXuSgAZq_2Fk3AFpzV0CSH4fpSEGnwtH-ClG06AbKu-_2N-gIxvYm5nZO2_UbA2GQ0c_alatR2FZrR02qzzcwd_vMmeHCg

import { test } from './index';


describe('index tests', () => {
  it('sample', () => {
    const val = test();
    expect(val).toEqual('hello world')
  })
})

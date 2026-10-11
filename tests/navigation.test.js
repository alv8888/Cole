import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeLink, decodeLink, numberIn, choice, MAX_LINK_LENGTH } from '../src/navigation/share.js';

test('URL round trip preserves values, Unicode, zero and unrelated query parameters', () => {
  const state={space:{configurations:[{body:'custom',mu:1.234567890123,radius:123,eccentricity:0}],elapsed:0,note:'μ & + #'}};
  const link=encodeLink('https://example.org/index.html?utm_source=study#model','space',state);
  assert.deepEqual(decodeLink(link,'space'),state);
  assert.equal(new URL(link).searchParams.get('utm_source'),'study');
  assert.equal(new URL(link).hash,'#model');
});
test('URL decoder rejects partial, duplicate, malformed, cross-lab and unsupported versions',()=>{
  assert.equal(decodeLink('https://example.org/?utm=x','space'),null);
  for(const query of ['lab=space','lab=space&v=1&sim={','lab=rocket&v=1&sim={}','lab=space&v=2&sim={}','lab=space&lab=space&v=1&sim={}','lab=space&v=1&sim=null','lab=space&v=1&sim=[]']){
    assert.throws(()=>decodeLink(`https://example.org/?${query}`,'space'));
  }
});
test('Nonfinite and oversized states cannot produce valid share links',()=>{
  for(const value of [NaN,Infinity,-Infinity]) assert.throws(()=>encodeLink('https://example.org','space',{value}));
  assert.throws(()=>encodeLink('https://example.org','space',{value:'x'.repeat(MAX_LINK_LENGTH)}));
  assert.throws(()=>decodeLink(`https://example.org/?lab=space&v=1&sim=${'x'.repeat(MAX_LINK_LENGTH)}`,'space'));
});
test('URL parameters require finite numeric values and exact declared choices',()=>{
  for(const value of [null,'1',NaN,Infinity,-1,11]) assert.throws(()=>numberIn(value,0,10));
  assert.equal(numberIn(0,0,10),0);assert.equal(numberIn(10,0,10),10);
  assert.throws(()=>choice('10',['1','60']));assert.equal(choice(false,[false,true]),false);
});

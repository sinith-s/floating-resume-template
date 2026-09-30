import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateResume} from '../scripts/validate-resume.mjs';
const profile=JSON.parse(fs.readFileSync(new URL('../content/resume.json',import.meta.url),'utf8'));
const example=JSON.parse(fs.readFileSync(new URL('../content/examples/alex-taylor.json',import.meta.url),'utf8'));
const copy=()=>{
  const p=structuredClone(example);
  p.identity.email='alex@example.com';p.identity.github='https://github.com/example';
  p.projects.push({...p.projects[0],id:'second-project'});
  p.certifications=[{name:'Example credential',color:'#0755ed'}];
  return p;
};
test('current profile validates including assets',()=>assert.deepEqual(validateResume(profile,{checkAssets:true}),[]));
test('another identity requires no component changes',()=>{
  const p=copy();Object.assign(p.identity,{firstName:'Alex',lastName:'Taylor',monogram:'AT',role:'Software Engineer',email:'alex@example.com',siteUrl:'https://example.com',github:'https://github.com/example',linkedin:'https://www.linkedin.com/in/example'});
  assert.deepEqual(validateResume(p),[]);
});
test('invalid profiles fail with actionable paths',()=>{
  const p=copy();p.identity.email='invalid';p.identity.github='javascript:alert(1)';p.featuredProjectIds[0]='missing-project';
  const errors=validateResume(p);assert.ok(errors.some(e=>e.includes('identity.email')));assert.ok(errors.some(e=>e.includes('identity.github')));
  p.identity.email='alex@example.com';p.identity.github='https://github.com/example';
  assert.ok(validateResume(p).some(e=>e.includes('missing-project')));
});
test('short profiles, optional contacts and badges without files validate',()=>{
  assert.deepEqual(validateResume(example,{checkAssets:true}),[]);
  const p=copy();assert.deepEqual(validateResume(p,{checkAssets:true}),[]);
});
test('all empty sections are valid, including no featured projects',()=>{
  const p=copy();for(const key of ['projects','skills','technologies','experience','certifications','featuredProjectIds'])p[key]=[];
  assert.deepEqual(validateResume(p),[]);
});
test('long profiles validate and excessive profiles fail explicitly',()=>{
  const p=copy();
  p.experience=Array.from({length:60},(_,i)=>({name:'Employer '+i,dates:'2024'}));
  p.certifications=Array.from({length:60},(_,i)=>({name:'Credential '+i,color:'#0755ed'}));
  assert.deepEqual(validateResume(p),[]);
  p.certifications.push(p.certifications[0]);assert.ok(validateResume(p).some(e=>e.includes('certifications')));
});
test('unknown fields, duplicate IDs and absent assets are rejected',()=>{
  const p=copy();p.projects[1].id=p.projects[0].id;p.certifications[0].file='/missing-cert.png';
  assert.ok(validateResume(p,{checkAssets:true}).some(e=>e.includes('duplicate')));
  assert.ok(validateResume(p,{checkAssets:true}).some(e=>e.includes('Missing public asset')));
  p.identity.secret='never publish';assert.ok(validateResume(p).some(e=>e.includes('unknown field')));
});

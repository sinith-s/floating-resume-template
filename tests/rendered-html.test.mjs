import assert from "node:assert/strict";
import {readFile, readdir, stat} from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../dist/client/",import.meta.url));
const profile=JSON.parse(await readFile(process.env.RESUME_PROFILE??new URL("../content/resume.json",import.meta.url),"utf8"));

test("exports the portfolio and reference route",async()=>{
  const html=await readFile(path.join(root,"index.html"),"utf8");
  const escaped=(value)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
  assert.ok(html.includes(escaped(`${profile.identity.firstName} ${profile.identity.lastName}`)));
  assert.match(html,/Welcome aboard/);
  assert.match(html,/aria-label="Turn ambient music on"/);
  assert.doesNotMatch(html,/Your site is taking shape/);
  await stat(path.join(root,"platform-preview.html"));
  await stat(path.join(root,"404.html"));
  const assets=[...html.matchAll(/(?:src|href)="(\/[^"#?]+)(?:\?[^"]*)?"/g)].map(m=>m[1]);
  for(const asset of assets) await stat(path.join(root,decodeURIComponent(asset)));
});

test("ships required assets, not experiments or harnesses",async()=>{
  for(const name of ["platform-six-views.png","fonts/barlow-condensed-extrabold.ttf","technology-logos/python.svg",...profile.certifications.flatMap(c=>c.file?[c.file.slice(1)]:[])])
    await stat(path.join(root,name));
  const files=await readdir(root);
  for(const name of ["__scroll-test.html","__performance-test.html","crayon-space.png","cloud-world-v2.png","_worker.js"])
    assert.ok(!files.includes(name),name+" must not ship");
});

test("static files stay below the upload size limit",async()=>{
  async function walk(folder){
    for(const entry of await readdir(folder,{withFileTypes:true})){
      const file=path.join(folder,entry.name);
      if(entry.isDirectory())await walk(file);
      else assert.ok((await stat(file)).size<25*1024*1024,path.relative(root,file));
    }
  }
  await walk(root);
});

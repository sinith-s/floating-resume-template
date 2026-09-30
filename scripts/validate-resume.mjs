import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const schema=JSON.parse(fs.readFileSync(path.join(root,"content/resume.schema.json"),"utf8"));
const stationNames=["Projects","Skills","Companies worked","Technologies used","Certifications"];

// Small, offline validator for the schema keywords used in resume.schema.json.
// Keep this deliberately dependency-free; do not silently accept new keywords.
export function validateResume(data,{checkAssets=false}={}){
  const errors=[];
  function visit(value,rule,at){
    const type=Array.isArray(value)?"array":value===null?"null":typeof value;
    if(type!==rule.type){errors.push(at+": expected "+rule.type);return}
    if(rule.const!==undefined&&value!==rule.const)errors.push(at+": unsupported value");
    if(type==="string"){
      if((rule.minLength??0)>0&&(!value.trim()||value.length<rule.minLength))errors.push(at+": must not be blank");
      if(rule.maxLength&&value.length>rule.maxLength)errors.push(at+": too long for the current layout");
      if(rule.pattern&&!new RegExp(rule.pattern).test(value))errors.push(at+": invalid format");
      if(rule.format==="https-url"){
        try{const u=new URL(value);if(u.protocol!=="https:"||u.username||u.password)throw Error()}catch{errors.push(at+": expected HTTPS URL without credentials")}
      }
      if(rule.format==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))errors.push(at+": invalid email");
    }
    if(type==="array"){
      if(value.length<(rule.minItems??0)||value.length>(rule.maxItems??Infinity))errors.push(at+": expected "+rule.minItems+"–"+rule.maxItems+" entries");
      value.forEach((item,i)=>{const child=rule.prefixItems?.[i]??rule.items;if(child&&typeof child==="object")visit(item,child,at+"["+i+"]")});
    }
    if(type==="object"){
      for(const key of rule.required??[])if(!(key in value))errors.push(at+"."+key+": required");
      for(const [key,item] of Object.entries(value)){
        if(rule.properties[key])visit(item,rule.properties[key],at+"."+key);
        else if(rule.additionalProperties===false)errors.push(at+"."+key+": unknown field");
      }
    }
  }
  visit(data,schema,"resume");
  if(errors.length)return errors;
  for(const key of ["projects","skills","technologies"]){
    const ids=data[key].map(item=>item.id);
    if(new Set(ids).size!==ids.length)errors.push(key+": duplicate IDs");
  }
  const projectIds=new Set(data.projects.map(p=>p.id));
  for(const id of [...data.featuredProjectIds,...data.skills.flatMap(s=>s.projects)])
    if(!projectIds.has(id))errors.push("Unknown project reference: "+id);
  if(new Set(data.featuredProjectIds).size!==data.featuredProjectIds.length)errors.push("featuredProjectIds: choose distinct projects");
  data.stations.forEach((s,i)=>{if(s.nav!==stationNames[i])errors.push("stations["+i+"].nav: keep "+stationNames[i]+" for the current renderer")});
  const assets=[data.identity.socialImage,...data.certifications.map(c=>c.file),...data.technologies.flatMap(c=>c.logos.map(([,id])=>"/technology-logos/"+id+".svg"))];
  for(const asset of assets.filter(Boolean)){
    if(asset.includes("..")||asset.includes("//"))errors.push("Unsafe asset path: "+asset);
    else if(checkAssets&&!fs.existsSync(path.join(root,"public",asset.slice(1))))errors.push("Missing public asset: "+asset);
  }
  return errors;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const file=path.resolve(process.argv[2]??process.env.RESUME_PROFILE??path.join(root,"content/resume.json"));
    const errors=validateResume(JSON.parse(fs.readFileSync(file,"utf8")),{checkAssets:true});
    if(errors.length){console.error("Resume validation failed:\n- "+errors.join("\n- "));process.exitCode=1}
    else console.log("Resume valid: schema, references and local assets checked.");
  }catch(error){console.error("Cannot validate resume: "+error.message);process.exitCode=1}
}

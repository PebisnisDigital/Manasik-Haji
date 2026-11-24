import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const suites=[
 ['hajj-field-qa.mjs'],
 ['tahallul-action-qa.mjs'],
 ['tahallul-approach-qa.mjs'],
 ['sai-approach-qa.mjs'],
 ['tawaf-atmosphere-qa.mjs'],
 ['continuous-tawaf-qa.mjs'],
 ['arrival-journey-qa.mjs'],
 ['miqat-lesson-qa.mjs'],
 ['magic-access-qa.mjs'],
 ['gate-registration-qa.mjs'],
 ['travel-entry-qa.mjs','--production'],
 ['character-consistency-qa.mjs','--production'],
 ['front-menu-qa.mjs','--production'],
 ['district-production-qa.mjs'],
 ['adventure-qa.mjs'],
 ['classic-cast-qa.mjs'],
 ['campaign-recovery-qa.mjs'],
];
const results=[];
for(const [script,...args]of suites){console.log('QA:',script,args.join(' '));const started=Date.now();const code=await new Promise((resolve,reject)=>{const process=spawn('node',['tools/'+script,...args],{stdio:'inherit',shell:false});process.on('error',reject);process.on('exit',resolve);});results.push({script,args,passed:code===0,seconds:Math.round((Date.now()-started)/1000)});}
await mkdir('qa-output',{recursive:true});await writeFile('qa-output/entry-regression.json',JSON.stringify({passed:results.every(r=>r.passed),results},null,2));if(results.some(r=>!r.passed))process.exitCode=1;

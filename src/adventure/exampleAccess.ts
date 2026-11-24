/** Public practice mode, not authentication or a paid registration. */
export function isExampleMode(search=typeof location==='undefined'?'':location.search){const p=new URLSearchParams(search);return p.get('board')==='contoh'||p.get('contoh')==='1';}
export function exampleKey(key:string,active=isExampleMode()){return active&&!key.startsWith('contoh:')?'contoh:'+key:key;}
export function validExampleCode(code:string){return code.trim().toUpperCase()==='CONTOH';}

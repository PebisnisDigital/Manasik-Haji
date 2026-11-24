import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Network-only HTML with an offline fallback. Never cache a user's navigation response.
export const PUBLIC_GAME_PAGES=['','index.html','manasik.html','player.html','sai.html','district.html','hajj-adventure.html','adventure.html','adventure-map.html','tawaf-adventure.html','sai-adventure.html','tahallul-adventure.html','legacy.html','umrah.html','explore.html','hajj.html'];
export function pwaVersion(root,files){
  const hash=crypto.createHash('sha256');
  for(const file of [...new Set(files)].sort())hash.update(file+'\0').update(fs.readFileSync(path.join(root,file)));
  return 'umroh-static-'+hash.digest('hex').slice(0,16);
}

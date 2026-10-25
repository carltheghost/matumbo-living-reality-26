import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
let js=['model.mjs','world.mjs','ui.mjs'].map(name=>read(`src/social/${name}`)).join('\n\n');
js=js.replace(/^import .*?;\s*$/gm,'').replace(/\bexport (const|function)\b/g,'$1');
const css=read('src/social/social.css');
const hash=s=>createHash('sha256').update(s).digest('base64');
let html=read('social.html').replace('<link rel="stylesheet" href="./src/social/social.css">',`<style>${css}</style>`)
 .replace('<script type="module" src="./src/social/ui.mjs"></script>',`<script type="module">${js}</script>`)
 .replace("script-src 'self'",`script-src 'sha256-${hash(js)}'`).replace("style-src 'self'",`style-src 'sha256-${hash(css)}'`)
 .replaceAll('href="./index.html"','href="#main"').replace('← Return to Reality','↑ Top of workspace');
mkdirSync(path.join(root,'dist'),{recursive:true});
writeFileSync(path.join(root,'dist/maTumbo_Social_Mirror.html'),html);
console.log('Created dist/maTumbo_Social_Mirror.html. This is a local prototype, not a hosted network.');

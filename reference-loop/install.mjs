import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Register this one shared package with both local clients. No hooks, settings,
// model selections, permission overrides, network calls or background processes.
const source=fs.realpathSync(path.dirname(fileURLToPath(import.meta.url)));
const [mode, directory]=process.argv.slice(2);
if (mode && (mode!=='--project' || !directory)) throw new Error('Usage: node install.mjs [--project PROJECT_DIRECTORY]');
if (Number(process.versions.node.split('.')[0])<22) throw new Error('Node 22 or later is required.');
for (const item of ['SKILL.md','loop.mjs','collect.mjs','references/result-template.md']) {
  if (!fs.existsSync(path.join(source,item))) throw new Error('Missing shared helper: '+item);
}
const root=mode==='--project'?path.resolve(directory):os.homedir();
const destinations=[
  {client:'Codex',path:path.join(root,'.agents','skills','reference-loop'),invocation:'$reference-loop'},
  {client:'Claude Code',path:path.join(root,'.claude','skills','reference-loop'),invocation:'/reference-loop'}
];
// Preflight both locations before creating either link. Existing content is never replaced.
for (const item of destinations) {
  let existing;
  try { existing=fs.lstatSync(item.path); } catch(error) { if(error.code!=='ENOENT') throw error; }
  if (existing && (!existing.isSymbolicLink() || fs.realpathSync(item.path)!==source))
    throw new Error('Existing unrelated entry preserved: '+item.path);
  item.already_linked=Boolean(existing);
}
for (const item of destinations) {
  if (item.already_linked) continue;
  fs.mkdirSync(path.dirname(item.path),{recursive:true});
  fs.symlinkSync(source,item.path,process.platform==='win32'?'junction':'dir');
}
console.log(JSON.stringify({scope:mode==='--project'?'project':'this user on this device',source,clients:destinations,next:'Open a new client session if the skill is not listed. Invoke it with a project need or a task folder. Installation does not establish client execution or another device readiness.'},null,2));

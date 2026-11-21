import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Build a portable source folder. It does not register skills or change client settings.
const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
const files = ['SKILL.md', 'loop.mjs', 'collect.mjs', 'install.mjs', 'package.mjs', 'package.json', 'references/result-template.md', 'references/source-tools.md', 'references/delegation.md', 'references/repo-reading.md', 'loop.test.mjs', 'flow.mjs', 'test.mjs', 'FLOW.md', 'README.md', 'telegram/public_server.py', 'telegram/account.py', 'telegram/setup.py', 'telegram/check.py', 'telegram/inspect_feeds.py', 'telegram/feed_server.py', 'telegram/sources.opml'];
if (!target) throw new Error('Usage: node package.mjs NEW_OUTPUT_DIRECTORY');
const root = path.resolve(target);
for (const name of files) if (fs.existsSync(path.join(root,name))) throw new Error('Preserving existing file: '+path.join(root,name));
for (const name of files) {
  const output = path.join(root,name);
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.copyFileSync(path.join(here,name), output, fs.constants.COPYFILE_EXCL);
}
console.log('Portable workflow source: '+root+'\nRead SKILL.md in either client. No client settings changed.');

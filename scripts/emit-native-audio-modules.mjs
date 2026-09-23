/** Explicit private-output ESM emission. Integration alone promotes these static code files. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const repo = fileURLToPath(new URL('../', import.meta.url)), output = process.argv[2];
if (!output || !path.isAbsolute(output) || !output.startsWith('/Volumes/') || path.resolve(output).startsWith(repo))
  throw new Error('Supply a fresh absolute SSD output directory under /Volumes/, outside the checkout');
try { await fs.access(output); throw new Error('Output already exists'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const configPath = path.join(repo, 'tsconfig.native-audio.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, repo, { outDir: output }, configPath);
const host = ts.createCompilerHost(parsed.options), emitted = new Map();
host.writeFile = (name, text) => emitted.set(path.relative(output, name), Buffer.from(text));
const program = ts.createProgram(parsed.fileNames, parsed.options, host);
const errors = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
const result = program.emit(); errors.push(...result.diagnostics);
if (result.emitSkipped || errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName:x=>x, getCurrentDirectory:()=>repo, getNewLine:()=> '\n' }));
for (const [name, bytes] of emitted) {
  if (name.startsWith('..') || path.isAbsolute(name) || !name.endsWith('.js')) throw new Error('Invalid emitted path');
  const source = bytes.toString('utf8');
  for (const imported of ts.preProcessFile(source, true).importedFiles) {
    const specifier = imported.fileName;
    if (!specifier.startsWith('./') || !specifier.endsWith('.js') || !emitted.has(path.posix.normalize(path.posix.join(path.posix.dirname(name), specifier))))
      throw new Error(`Non-standalone import ${name}: ${specifier}`);
  }
  if (/\brequire\s*\(|\bprocess\.(env|versions)|from\s*['"][^'"]+\.tsx?['"]/.test(source)) throw new Error(`Non-worker output ${name}`);
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
emitted.set('LICENSE.txt', await fs.readFile(path.join(repo, 'src/os/native-home-audio/LICENSE.txt')));
const sources = {};
for (const source of program.getSourceFiles()) if (source.fileName.startsWith(path.join(repo, 'src/os/native-home-audio/')))
  sources[path.relative(repo, source.fileName)] = sha(await fs.readFile(source.fileName));
sources['tsconfig.native-audio.json'] = sha(await fs.readFile(configPath));
sources['scripts/emit-native-audio-modules.mjs'] = sha(await fs.readFile(fileURLToPath(import.meta.url)));
const manifest = { schema:1, protocol:1, processor:'native-home-music-output-v1', compiler:{name:'TypeScript',version:ts.version},
  entries:{worker:'music-synthesis.worker.js',worklet:'music-output.worklet.js'}, sources,
  files:Object.fromEntries([...emitted].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,{bytes:bytes.length,sha256:sha(bytes)}])) };
await fs.mkdir(output,{recursive:true});
for (const [name,bytes] of emitted) await fs.writeFile(path.join(output,name),bytes);
await fs.writeFile(path.join(output,'modules.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({output,files:emitted.size+1,bytes:[...emitted.values()].reduce((n,v)=>n+v.length,0),entries:manifest.entries}));

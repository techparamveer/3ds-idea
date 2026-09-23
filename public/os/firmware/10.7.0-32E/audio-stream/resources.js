const decoded = new WeakMap();
const ALLOWED = new Set([0x80, 0x81, 0x88, 0x89, 0x8a, 0xb0, 0xb6, 0xc0, 0xc1, 0xc4, 0xc5, 0xc6, 0xc7,
    0xca, 0xcb, 0xcc, 0xcd, 0xd0, 0xd1, 0xd2, 0xd3, 0xd5, 0xd7, 0xd9, 0xe0, 0xe1, 0xfd]);
const TABLES = {
    pan: [257, 'f', '383ea4d362109b74ddccfdaacf46a0bf4b0255f3609cf01f5824e1910e7c7597'],
    attack: [128, 'f', '3a9d21132f66d969657cf76ea8f5ffb5e4a9df7abba4dd66baaf2d2695ae35c6'],
    pitchSemitone: [12, 'f', '268bc185e52bc0f4973bfc9d4959f605057e1b6a5bc386a8ce8feb4afcb1936d'],
    pitchFraction: [256, 'f', 'ce9d87899dbdc1e5b59a1cd3b26107334c55d50aef782242944eb83d7c401cc6'],
    gain: [965, 'f', 'bbda3f9ee473d0aba17c2c98369d0d5b7b0a9d788b47384bc76d17e0f91d1696'],
    sustain: [128, 'h', '3315552d46c21be4911d400e3a3a747a36b9866088226f6f7a113ca3f9b01086'],
    sine: [33, 'b', 'a742b4ef2370e98c41180ed22400a062ced15a1ffb49d17e2b12a2bf0eabdfd6'],
};
function check(condition, message) {
    if (!condition)
        throw new Error(`Invalid HOME music resources: ${message}`);
}
function object(value) {
    check(value !== null && typeof value === 'object' && !Array.isArray(value), 'object expected');
    return value;
}
function array(value) { check(Array.isArray(value), 'array expected'); return value; }
function integer(value, low, high) {
    check(typeof value === 'number' && Number.isSafeInteger(value) && value >= low && value <= high, 'integer range');
    return value;
}
async function sha(data) {
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(data).buffer)), x => x.toString(16).padStart(2, '0')).join('');
}
/** Pure grammar/control-flow validation; unsupported commands are never skipped. */
export function validateSequence(blob, start) {
    check(blob.length > 0 && blob.length <= 65536, 'sequence size');
    const seen = new Set(), occupied = new Set(), pending = [start];
    const byte = (i) => { check(i >= 0 && i < blob.length, 'truncated command'); return blob[i]; };
    const vl = (i) => {
        let value = 0;
        for (let count = 0; count < 4; count++) {
            const b = byte(i++);
            value = value * 128 + (b & 127);
            if (!(b & 128))
                return [value, i];
        }
        throw new Error('Invalid HOME music resources: overlong varint');
    };
    const u24 = (i) => byte(i) * 65536 + byte(i + 1) * 256 + byte(i + 2);
    while (pending.length) {
        let pos = pending.pop();
        while (!seen.has(pos)) {
            const cmd = byte(pos);
            check(cmd < 128 || ALLOWED.has(cmd), `unsupported command ${cmd.toString(16)}`);
            let end = pos + 1;
            if (cmd < 128) {
                check(byte(end++) <= 127, 'velocity');
                const [gate, next] = vl(end);
                check(gate > 0, 'zero-gate note');
                end = next;
            }
            else if (cmd === 0x80 || cmd === 0x81) {
                const [value, next] = vl(end);
                end = next;
                if (cmd === 0x81)
                    check((value & 127) < 128 && (value >> 8) <= 3, 'program');
            }
            else if (cmd === 0x88) {
                check(byte(end) > 0 && byte(end) < 16, 'track');
                pending.push(u24(end + 1));
                end += 4;
            }
            else if (cmd === 0x89 || cmd === 0x8a) {
                pending.push(u24(end));
                end += 3;
            }
            else if (cmd === 0xe0 || cmd === 0xe1) {
                byte(end);
                byte(end + 1);
                end += 2;
            }
            else if (cmd !== 0xfd) {
                const value = byte(end++);
                if ([0xc0, 0xc1, 0xca, 0xcb, 0xcd, 0xd0, 0xd1, 0xd2, 0xd3, 0xd5, 0xd9].includes(cmd))
                    check(value <= 127, 'parameter');
                if (cmd === 0xcc)
                    check(value <= 2, 'modulation type');
                if (cmd === 0xb6)
                    check(value <= 3, 'bank slot');
                if (cmd === 0xc7)
                    check(value <= 1, 'note wait flag');
            }
            check(end <= blob.length, 'command size');
            for (let i = pos; i < end; i++) {
                check(!occupied.has(i), 'overlapping command target');
                occupied.add(i);
            }
            seen.add(pos);
            if (cmd === 0x89 || cmd === 0xfd)
                break;
            pos = end;
        }
    }
    return seen;
}
function region(value, waves, available) {
    const r = {};
    for (const key of ['war_slot', 'wav_index', 'volume', 'pan', 'interp', 'attack', 'decay', 'sustain', 'hold', 'release'])
        r[key] = integer(value[key], 0, key === 'war_slot' || key === 'wav_index' ? 0xffffff : 127);
    r.org_key = integer(value.org_key, -128, 127);
    check(typeof value.pitch === 'number' && Number.isFinite(value.pitch) && value.pitch > 0 && value.pitch <= 16, 'region pitch');
    r.pitch = value.pitch;
    check(value.ignore_note_off === false && r.interp === 0, 'region mode');
    r.ignore_note_off = false;
    check(available ? waves[`${r.war_slot}:${r.wav_index}`] : r.war_slot === 3 && (r.wav_index === 5 || r.wav_index === 6), 'missing region wave');
    return r;
}
function bankNode(value, waves, available, depth = 0) {
    check(depth <= 2, 'bank depth');
    if (value === null)
        return null;
    if (!Array.isArray(value)) {
        check(depth === 2, 'region depth');
        return region(object(value), waves, available);
    }
    if (value[0] === 'direct') {
        check(value.length === 2, 'direct node');
        return ['direct', bankNode(value[1], waves, available, depth + 1)];
    }
    if (value[0] === 'range') {
        const lo = integer(value[1], 0, 127), hi = integer(value[2], lo, 127), children = array(value[3]);
        check(value.length === 4 && children.length === hi - lo + 1, 'bank range');
        return ['range', lo, hi, children.map(x => bankNode(x, waves, available, depth + 1))];
    }
    check(value[0] === 'index' && value.length === 3, 'bank node');
    const keys = array(value[1]).map(x => integer(x, 0, 127)), children = array(value[2]);
    check(keys.length > 0 && keys.length === children.length && keys.every((x, i) => i === 0 || x > keys[i - 1]), 'bank index');
    return ['index', keys, children.map(x => bankNode(x, waves, available, depth + 1))];
}
export function selectRegion(instruments, program, key, velocity) {
    const select = (node, value) => {
        if (!node)
            return null;
        if (!Array.isArray(node))
            return node;
        if (node[0] === 'direct')
            return node[1];
        if (node[0] === 'range')
            return value >= node[1] && value <= node[2] ? node[3][value - node[1]] : null;
        const i = node[1].findIndex(bound => value <= bound);
        return i < 0 ? null : node[2][i];
    };
    const keyRegion = select(instruments[program], key);
    const result = keyRegion && !Array.isArray(keyRegion) ? keyRegion : select(keyRegion, velocity);
    check(result && !Array.isArray(result), 'missing program/key/velocity region');
    return result;
}
/** No I/O: caller supplies bytes. Digests run before decoding; private copies outlive caller buffers. */
export async function decodeNativeHomeMusicResources(manifest, files) {
    const m = object(structuredClone(manifest)), title = object(m.title), profile = object(m.profile), archive = object(m.archive);
    check(m.schema === 1 && m.kind === 'native-home-music' && m.sampleRate === 32728 && m.frameSamples === 160, 'schema');
    check(title.titleId === '0004003000009802' && title.version === 24576 && profile.id === 'eur-home-24576-stereo-startup-v8' &&
        archive.sha256 === '1017eb4a367cb202ac6018fb432b5654222487149d16242fa7d1f205e63f3eb2', 'source profile');
    const expected = ['music.cseq', 'music-resume.cseq', 'tables.bin', ...Array.from({ length: 5 }, (_, i) => `wave-3-${i}.pcm`)];
    const records = object(m.resources), copies = new Map();
    check(Object.keys(records).length === expected.length && files.size === expected.length, 'resource set');
    // Take every copy synchronously before the first await; caller mutations cannot race later inputs.
    for (const name of expected) {
        const record = object(records[name]), bytes = files.get(name);
        check(bytes instanceof Uint8Array, 'missing resource');
        check(bytes.byteLength === integer(record.bytes, 1, 262144), 'resource size');
        copies.set(name, new Uint8Array(bytes));
    }
    for (const [name, data] of copies)
        check(await sha(data) === object(records[name]).sha256, `digest ${name}`);
    const waves = {}, wm = object(m.waves);
    check(Object.keys(wm).length === 5, 'wave set');
    for (let i = 0; i < 5; i++) {
        const w = object(wm[`3:${i}`]), name = `wave-3-${i}.pcm`, raw = copies.get(name);
        check(w.file === name && w.rate === 44100 && w.loop === true, 'wave profile');
        const count = integer(w.samples, 1, 131072), loop = integer(w.loopStart, 0, count - 1);
        check(w.loopEnd === count && raw.length === count * 2, 'PCM shape');
        const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength), samples = new Int16Array(count);
        for (let j = 0; j < count; j++)
            samples[j] = view.getInt16(j * 2, true);
        waves[`3:${i}`] = { samples, loop: true, loop_start: loop, rate: 44100, sha256: String(object(records[name]).sha256) };
    }
    const tm = object(m.tables), tableRaw = copies.get('tables.bin'), tables = {};
    let tableEnd = 0;
    check(Object.keys(tm).length === 7, 'table set');
    for (const name of Object.keys(TABLES)) {
        const [count, format, hash] = TABLES[name], descriptor = object(tm[name]), size = format === 'f' ? 4 : format === 'h' ? 2 : 1;
        check(descriptor.offset === tableEnd && descriptor.count === count && descriptor.format === format && descriptor.sha256 === hash, 'table descriptor');
        const bytes = tableRaw.slice(tableEnd, tableEnd + count * size);
        check(bytes.length === count * size && await sha(bytes) === hash, 'table bytes');
        const v = new DataView(bytes.buffer);
        tables[name] = Array.from({ length: count }, (_, j) => format === 'f' ? v.getFloat32(j * size, true) : format === 'h' ? v.getInt16(j * size, true) : v.getInt8(j));
        tableEnd += count * size;
    }
    check(tableEnd === tableRaw.length, 'table trailing data');
    const bm = object(m.banks);
    check(Object.keys(bm).length === 1 && bm['1'], 'bank set');
    const bank = object(bm['1']);
    check(JSON.stringify(bank.availablePrograms) === '[5,6,11,14]' && JSON.stringify(bank.unavailablePrograms) === '[0,1]', 'program availability');
    const banks = { '1': array(bank.instruments).map((x, program) => {
            const available = [5, 6, 11, 14].includes(program);
            check(x === null || available || program === 0 || program === 1, 'unclassified program');
            const node = bankNode(x, waves, available);
            return available ? node : null; // Full original tree stays in provenance; unavailable programs cannot be used.
        }) };
    const em = object(m.entries), entries = {};
    check(Object.keys(em).length === 2, 'entry set');
    for (const alias of ['music', 'music-resume']) {
        const e = object(em[alias]);
        check(e.file === `${alias}.cseq`, 'entry file');
        const blob = copies.get(`${alias}.cseq`), start = integer(e.start, 0, blob.length - 1);
        const bankIds = array(e.banks).map(x => integer(x, 0, 0xffffff));
        check(bankIds.length > 0 && bankIds.length <= 4 && bankIds.every(id => id === 1 || id === 0xffffff), 'bank reference');
        const positions = validateSequence(blob, start);
        check(positions.size === e.reachableCommands, 'coverage');
        entries[alias] = { blob, start, banks: bankIds, volume: integer(e.volume, 0, 127), priority: integer(e.priority, 0, 255) };
        // All reachable program selections in this profile use bank slot zero. Validate their full key/velocity domain.
        for (const pos of positions) {
            if (blob[pos] === 0xb6)
                check(blob[pos + 1] === 0, 'unsupported bank selection');
            if (blob[pos] === 0x81) {
                let p = pos + 1, program = 0, b;
                do {
                    b = blob[p++];
                    program = program * 128 + (b & 127);
                } while (b & 128);
                check([5, 6, 11, 14].includes(program) && bankIds[0] === 1, 'unavailable program');
                for (let key = 0; key < 128; key++)
                    for (let velocity = 0; velocity < 128; velocity++)
                        selectRegion(banks['1'], program, key, velocity);
            }
        }
    }
    const handle = Object.freeze({ kind: 'native-home-music', schema: 1 });
    decoded.set(handle, { entries, banks, waves, tables });
    return handle;
}
/** Internal module boundary; the public barrel never exposes decoded buffers. */
export function resourcesForEngine(handle) {
    const value = decoded.get(handle);
    check(value, 'unvalidated resource handle');
    return value;
}

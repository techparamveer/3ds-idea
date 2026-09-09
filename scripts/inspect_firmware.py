"""Read CIA/NCCH metadata from a user-supplied archive without executing firmware."""
import zipfile, struct, json, sys, hashlib
from pathlib import Path
align=lambda x:(x+63)&~63
rows=[]
with zipfile.ZipFile(sys.argv[1]) as z:
 for name in z.namelist():
  if not name.endswith('.cia'):continue
  b=z.read(name);hs,typ,ver,cs,ts,ms,metas,content_size=struct.unpack_from('<IHHIIIIQ',b)
  off=align(align(align(hs)+cs)+ts)+align(ms)
  # TMD signature sizes include padding and signature type field.
  tmdoff=align(align(hs)+cs)+align(ts)
  sigtype=int.from_bytes(b[tmdoff:tmdoff+4],'big');sigsize={0x10000:0x240,0x10001:0x140,0x10002:0x80,0x10003:0x240,0x10004:0x140,0x10005:0x80}.get(sigtype,0x140)
  t=tmdoff+sigsize;count=int.from_bytes(b[t+0x9e:t+0xa0],'big')
  chunk=t+0x9c4
  content_flags=int.from_bytes(b[chunk+6:chunk+8],'big')
  row={'cia_content_encrypted':bool(content_flags&1),'content_type_flags':content_flags,'file':Path(name).name,'size':len(b),'sha256':hashlib.sha256(b).hexdigest(),'content_offset':off,'content_count':count,'ncch_magic':b[off+0x100:off+0x104].decode('ascii','replace')}
  if row['ncch_magic']=='NCCH':
   flags=b[off+0x188:off+0x190];row['ncch_flags']=flags.hex();row['ncch_no_crypto']=bool(flags[7]&4);row['romfs_size']=int.from_bytes(b[off+0x1b4:off+0x1b8],'little')*512
  rows.append(row)
out=Path(__file__).resolve().parents[1]/'docs/firmware-inventory.json';out.write_text(json.dumps(rows,indent=2))
print(json.dumps({'packages':len(rows),'readable_ncch':sum(r['ncch_magic']=='NCCH' for r in rows),'unencrypted_ncch':sum(r.get('ncch_no_crypto',False) for r in rows),'home_menu':[r for r in rows if '0004003000009802' in r['file'] or '0004003020009802' in r['file']]},indent=2))

"""Write independent v8 PCM/state fixtures to an explicit private SSD directory."""
from pathlib import Path
import argparse, hashlib, inspect, json
import numpy as np
from .home_audio_profile import isolated_renderer,validate_source,validate_archive
from .home_audio_loop_state import snapshot
from .export_home_music import ALIASES


def generate(source, output, renderer, scratch, source_record, frames=70000):
    if output.exists():raise ValueError('Use a new reference output directory')
    validate_source(source,json.loads(source_record.read_text()))
    with isolated_renderer(renderer,scratch) as profile:
        from dualrip.formats.ctr.archive import CtrArchive
        from dualrip.formats.ctr.cseq import parse_cseq
        from dualrip.engine.ctr.sequencer import CseqPlayer
        archive=CtrArchive(source.read_bytes(),[],source.name);validate_archive(archive,list(ALIASES.values()))
        output.mkdir(parents=True);report={'schema':1,'profile':profile,'frames':frames,'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'entries':{}}
        for alias,name in ALIASES.items():
            sound=next(s for s in archive.sounds if s.name==name);blob,_=parse_cseq(archive.ctx.file_bytes(sound.file_id,'seq'))
            p=CseqPlayer(blob,archive.ctx.make_lookup(sound.bank_ids),32728,sound.channel_prio,loop_passes=32,base_vol=sound.volume);p.setup(sound.start_offset)
            checkpoints=[];loop_frames=set();waves={};digest=hashlib.sha256();max_voices=0;release_frames=0;pressure_frames=0
            def mark(start,end):
                track=inspect.currentframe().f_back.f_locals['self']
                if track.num==0:loop_frames.update([end//160,end//160+1,end//160+2])
            p.mark_loop=mark
            with (output/f'{alias}.pcm').open('wb') as pcm_file:
                for frame in range(frames):
                    p.timer();channels=p.generate(160);pcm=np.clip(np.asarray(channels).T,-32768,32767).astype('<i2').tobytes();pcm_file.write(pcm);digest.update(pcm)
                    active=sum(v.state!=0 for v in p.voices);max_voices=max(max_voices,active);release_frames+=any(v.state==5 for v in p.voices);pressure_frames+=active==24
                    if frame<64 or frame%512==0 or frame in loop_frames or frame==frames-1:
                        row=snapshot(p,waves);checkpoints.append({'frame':frame,'sample':row['sample'],'state':row['state']})
            (output/f'{alias}-states.json').write_text(json.dumps(checkpoints,separators=(',',':'))+'\n')
            report['entries'][alias]={'pcmSha256':digest.hexdigest(),'samples':p.now_sample,'checkpoints':len(checkpoints),'loopFrames':sorted(loop_frames),'maximumVoices':max_voices,'framesWithReleases':release_frames,'framesAt24Voices':pressure_frames}
            print(alias,report['entries'][alias],flush=True)
        (output/'reference.json').write_text(json.dumps(report,indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--renderer',type=Path,required=True);p.add_argument('--scratch',type=Path,required=True);p.add_argument('--source-record',type=Path,required=True);p.add_argument('--frames',type=int,default=70000)
    a=p.parse_args();generate(a.source,a.output,a.renderer,a.scratch,a.source_record,a.frames)

"""Independent NumPy response/delay and analytic FIR check of synthetic JS output."""
from pathlib import Path
import argparse,hashlib,json
import numpy as np

def check(root):
    meta=json.loads((root/'measurements.json').read_text());source=np.fromfile(root/'noise.pcm',dtype='<i2').reshape(-1,2);results={}
    native=meta['nativeRate'];amplitude=16000/32768
    for rate_text,cases in meta['rates'].items():
        rate=int(rate_text);impulse=np.fromfile(root/f'{rate}-impulse.f32',dtype='<f4').reshape(-1,2)[:,0].astype(float)
        count=int(np.ceil(meta['nativeFrames']*rate/native));assert len(impulse)==count
        nfft=1 << int(np.ceil(np.log2(count*2)));response=np.fft.rfft(impulse,nfft);freq=np.fft.rfftfreq(nfft,1/rate)
        magnitude=np.abs(response)/abs(response[0]);db=20*np.log10(np.maximum(magnitude,1e-20))
        passband=freq<=.40*min(native,rate);stopband=freq>=.50*min(native,rate)
        ripple=float(np.max(np.abs(db[passband])));stop=float(np.max(db[stopband]))
        half=cases['impulse']['state']['delayNativeFrames'];expected=(meta['impulseAt']+half)*rate/native
        peak=int(np.argmax(abs(impulse)));centroid=float(np.dot(np.arange(count),impulse)/impulse.sum())
        dc=np.fromfile(root/f'{rate}-dc.f32',dtype='<f4').reshape(-1,2)[4096:,0];dc_error=float(np.max(abs(dc-.25)))
        tone=np.fromfile(root/f'{rate}-pass.f32',dtype='<f4').reshape(-1,2)[:,0].astype(float);t=np.arange(4096,len(tone))/rate
        design=np.stack([np.sin(2*np.pi*1000*t),np.cos(2*np.pi*1000*t),np.ones_like(t)],axis=1)
        fit=np.linalg.lstsq(design,tone[4096:],rcond=None)[0];pass_gain=float(20*np.log10(np.hypot(*fit[:2])/amplitude))
        row={'outputSamples':count,'passbandMaxAbsoluteDb':ripple,'stopbandMaximumDb':stop,'declaredDelayNativeFrames':half,
            'expectedImpulsePeakPosition':expected,'actualPeakIndex':peak,'impulseCentroidErrorFrames':centroid-expected,
            'steadyDcMaximumError':dc_error,'oneKhzGainDb':pass_gain}
        taps=half*2;coefficients=np.fromfile(root/f'{rate}-kernel.f64',dtype='<f8').reshape(-1,taps)
        kernel_response=np.abs(np.fft.rfft(coefficients,131072,axis=1));kernel_freq=np.fft.rfftfreq(131072)
        kernel_response/=kernel_response[:,:1]
        row['phaseKernelStopbandMaximumDb']=float(20*np.log10(np.max(kernel_response[:,kernel_freq>=.5*min(1,rate/native)])))
        row['phaseKernelPassbandMaximumAbsoluteDb']=float(np.max(abs(20*np.log10(kernel_response[:,kernel_freq<=.4*min(1,rate/native)]))))
        row['aboveNyquistToneAliasDb']={}
        for name in (name for name in cases if name.startswith('stop')):
            tone=np.fromfile(root/f'{rate}-{name}.f32',dtype='<f4').reshape(-1,2)[:,0].astype(float);frequency=cases[name]['hz'];alias=abs(frequency-round(frequency/rate)*rate)
            design=np.stack([np.sin(2*np.pi*alias*t),np.cos(2*np.pi*alias*t),np.ones_like(t)],axis=1);fit=np.linalg.lstsq(design,tone[4096:],rcond=None)[0]
            row['aboveNyquistToneAliasDb'][name]=float(20*np.log10(max(np.hypot(*fit[:2])/amplitude,1e-20)))
        # A direct, analytic sinc/window evaluation does not use the JS phase table.
        observed=np.fromfile(root/f'{rate}-noise.f32',dtype='<f4').reshape(-1,2)
        indices=np.linspace(0,len(observed)-1,3000,dtype=np.int64);position=indices*native/rate-half;floor=np.floor(position).astype(np.int64);fraction=position-floor
        offsets=np.arange(-half+1,half+1);distance=offsets[None,:]-fraction[:,None];angle=np.pi*distance/half
        window=.35875+.48829*np.cos(angle)+.14128*np.cos(2*angle)+.01168*np.cos(3*angle);window[abs(distance)>=half]=0
        cutoff=.45*min(1,rate/native);weights=2*cutoff*np.sinc(2*cutoff*distance)*window;weights/=weights.sum(axis=1)[:,None]
        sample_indices=floor[:,None]+offsets[None,:];values=source[np.clip(sample_indices,0,len(source)-1),0].astype(float);values[sample_indices<0]=0
        expected_pcm=np.sum(values*weights,axis=1)/32768;error=observed[indices,0]-expected_pcm
        row['analyticReferenceMaximumError']=float(np.max(abs(error)));row['analyticReferenceRmsError']=float(np.sqrt(np.mean(error**2)))
        assert ripple<.02,(rate,'passband',ripple)
        assert stop < -75,(rate,'stopband',stop)
        assert abs(peak-expected)<=.6,(rate,'delay',peak,expected)
        assert abs(centroid-expected)<.02,(rate,'centroid',centroid,expected)
        assert dc_error<1e-6 and abs(pass_gain)<.02,(rate,'DC/tone')
        assert row['analyticReferenceMaximumError']<1e-6,(rate,'analytic',row)
        assert row['phaseKernelStopbandMaximumDb'] < -75,(rate,'kernel alias',row)
        for level in row['aboveNyquistToneAliasDb'].values():assert level < -75,(rate,'alias',row)
        results[rate_text]=row;print(rate,json.dumps(row),flush=True)
    provenance={'checkerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                'numpy':np.__version__,'inputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.iterdir()) if p.name=='measurements.json' or p.suffix in ('.f32','.f64','.pcm')}}
    (root/'independent-fir-check.json').write_text(json.dumps({'schema':1,'method':'NumPy FFT/least-squares + direct analytic sinc, no JS coefficient table','provenance':provenance,'results':results},indent=2)+'\n')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('root',type=Path);a=p.parse_args();check(a.root)

"""Whole-shell calibration avoids confusing dark cover glass with active LCD."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]

def main():
    references=[
      {'name':'Nintendo original LL front','url':'https://www.nintendo.co.jp/hardware/3dsseries/3dsll/img/3dsll-front.jpg','image_size':[576,545],'shell_x':[96,480],'surround_x':[146.5,430],'dark_panel_x':[153,423],'edge_uncertainty_pixels':1.5},
      {'name':'Original XL front promotional image','url':'https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg','image_size':[1794,1009],'shell_x':[526,1307],'surround_x':[628,1205],'bright_panel_x':[645.5,1186.5],'edge_uncertainty_pixels':2},
    ]
    for ref in references:
        width=ref['shell_x'][1]-ref['shell_x'][0];frame=ref['surround_x'][1]-ref['surround_x'][0];error=2*ref['edge_uncertainty_pixels']
        ref['surround_width_if_upper_shell_is_156_mm']=156*frame/width
        ref['edge_uncertainty_interval_mm']=[156*(frame-error)/(width+error),156*(frame+error)/(width-error)]
        key='dark_panel_x' if 'dark_panel_x' in ref else 'bright_panel_x'
        ref['panel_width_on_same_conditional_scale_mm']=156*(ref[key][1]-ref[key][0])/width
    result={'references':references,'method':'Manually inspected horizontal landmarks in native image pixels. Scale is the upper shell width, not dark screen width. Interval covers selected edge uncertainty only.','limitations':'156 mm is published closed overall width, not a separately published upper-cover dimension. Perspective, shell width differences, shadows and image artwork remain additional uncertainty. These are approximately 115 mm fits, not factory metrology.','decision':'Preview 115 mm upper opening against current 112 mm. Retain 106.2 x 63.72 mm active LCD. Do not treat the dark cover or artwork extent as exact active LCD width.'}
    target=ROOT/'model/candidates/joshua-xl/front-layout-calibration.json';target.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':main()

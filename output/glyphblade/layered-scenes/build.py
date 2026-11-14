from pathlib import Path
from PIL import Image
import shutil,json,hashlib
P=Path(__file__).resolve().parent; SRC=P.parent
scenes={'01-graveyard':{'ground':600,'assets':{'dead-tree':(11,300),'headstone':(10,90),'iron-fence':(17,95),'candelabrum':(12,165),'arch':(25,230),'pillar':(18,210),'hunter':(5,155),'skeleton':(6,145),'nun':(7,145)},'back':[('dead-tree',70,602),('dead-tree',1600,602)],'mid':[('iron-fence',300,600),('iron-fence',900,600),('headstone',720,600),('headstone',1320,600),('pillar',1150,600)],'near':[('candelabrum',1150,600)]},
'02-chapel':{'ground':700,'assets':{'drapes':(13,170),'candelabrum':(12,230),'pillar':(18,390),'arch':(25,350),'door':(16,320),'hunter':(5,175),'ghost':(8,200)},'back':[('arch',300,690),('arch',1200,690)],'mid':[('pillar',160,700),('pillar',1440,700),('drapes',600,230)],'near':[('candelabrum',280,700),('candelabrum',1400,700)]},
'03-crypt':{'ground':560,'assets':{'pillar':(18,330),'arch':(25,300),'door':(16,270),'candelabrum':(12,180),'crate-barrel':(28,140),'hunter':(5,170),'skeleton':(6,155),'zombie':(9,155)},'back':[('arch',100,560),('arch',1250,560)],'mid':[('pillar',500,560),('pillar',1550,560),('door',1830,560)],'near':[('candelabrum',800,560),('crate-barrel',1000,560)]},
'04-castle-garden':{'ground':600,'assets':{'dead-tree':(11,320),'headstone':(10,90),'iron-fence':(17,90),'candelabrum':(12,170),'arch':(25,300),'pillar':(18,220),'banner':(29,170),'hunter':(5,155),'skeleton':(6,145)},'back':[('dead-tree',10,600),('dead-tree',1700,600)],'mid':[('arch',400,600),('arch',1150,600),('iron-fence',700,600),('headstone',1500,600)],'near':[('candelabrum',1050,600),('banner',900,300)]}}
def save_record(path, source, op):
 data={'schema_version':1,'image':str(path.relative_to(SRC.parent.parent)),'image_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'dimensions':list(Image.open(path).size),'format':'PNG','generator':'Pillow deterministic image processing','prompt':None,'prompt_status':'not generated; deterministic derivative','references':[{'path':str(source.relative_to(SRC.parent.parent)),'role':'source artwork'}], 'operation':op,'creative_seed':{'value':None,'source':None,'used_for_generation':False,'note':'Deterministic operation.'}}
 path.with_name(path.name+'.generated.json').write_text(json.dumps(data,indent=2)+'\n')
for name,c in scenes.items():
 d=P/name
 for sub in ['source','background','foreground/tiles','foreground/props','characters']:(d/sub).mkdir(parents=True,exist_ok=True)
 scene=SRC/(name+'.png'); shutil.copy2(scene,d/'source'/'mockup.png')
 im=Image.open(scene).convert('RGBA'); w,h=im.size; ground=c['ground']
 # Exact source strips, kept as reference to preserve neighboring continuity.
 strip=im.crop((0,ground,w,h)); strip.save(d/'foreground'/'source-ground-strip.png');save_record(d/'foreground'/'source-ground-strip.png',scene,f'Exact crop (0,{ground},{w},{h}); may include original lighting and scene details.')
 for row,y in enumerate(range(0,h-ground,64)):
  for col,x in enumerate(range(0,w,128)):
   tile=Image.new('RGBA',(128,64));crop=strip.crop((x,y,min(x+128,w),min(y+64,h-ground)));tile.paste(crop,(0,0)); out=d/'foreground'/'tiles'/f'ground-r{row:02}-c{col:02}.png';tile.save(out);save_record(out,scene,f'Crop source at ({x},{ground+y}) size {crop.width}x{crop.height}; padded to 128x64 with transparency.')
 # Existing independently generated props: trim faint alpha noise and resize nearest-neighbor.
 assets={}
 for key,(number,height) in c['assets'].items():
  src=next(SRC.glob(f'{number:02d}-*.png'));obj=Image.open(src).convert('RGBA'); a=obj.getchannel('A'); box=a.point(lambda x:255 if x>=24 else 0).getbbox()
  if not box:continue
  obj=obj.crop(box); obj=obj.resize((max(1,round(obj.width*height/obj.height)),height),Image.Resampling.NEAREST)
  folder='characters' if key in ('hunter','skeleton','nun','zombie','ghost') else 'foreground/props';out=d/folder/(key+'.png');obj.save(out);save_record(out,src,f'Trim to alpha >=24 bounding box {box}, retain original alpha within box, resize nearest-neighbor to {obj.size}.')
  assets[key]=obj
 layers={}
 for level in ('back','mid','near'):
  layer=Image.new('RGBA',(w,h)); placements=[]
  for key,x,bottom in c[level]:
   obj=assets[key]; layer.alpha_composite(obj,(x,bottom-obj.height)); placements.append({'asset':key,'x':x,'bottom_y':bottom})
  out=d/'background'/f'{level}-props-layout.png';layer.save(out);layers[level]={'file':str(out.relative_to(d)),'placements':placements};save_record(out,scene,'Composite of separately supplied prop derivatives; positions in manifest. Source reference is scene for visual placement only.')
 manifest={'source': 'source/mockup.png','canvas_pixels':[w,h],'floor_top_y':ground,'tile_size':[128,64],'grid_origin':[0,ground],'source_tile_rows':(h-ground+63)//64,'source_tile_columns':(w+127)//128,'parallax_suggested_factors':{'far_plate':0.15,'back':0.35,'mid':0.65,'near':0.85,'ground':1.0},'layers':layers,'note':'Layer layouts are new compositions using existing separate props, not exact segmentation of the flattened image. Ground tile pieces preserve adjacency only in source order; repeating is not seamless. Rightmost and bottommost tiles may have transparent padding. Original and reconstructed scales differ; tune props per game.'}
 (d/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 readme=f'''# {name.replace('-', ' ').title()}\n\n- `source/mockup.png`: untouched copy of the flattened reference ({w} × {h}).\n- `background/far-plate.png`: reconstructed background, not a pixel-exact recovery of hidden scenery.\n- `background/back-props-layout.png`, `mid-props-layout.png`, `near-props-layout.png`: separate transparent {w} × {h} example parallax compositions. Back-to-front recommended scroll factors: 0.15, 0.35, 0.65, 0.85; foreground 1.0. Set the positions and factors in your engine; PNGs do not carry scrolling behaviour.\n- `foreground/props/` and `characters/`: independent transparent assets resized from the existing project artwork. The example layouts use only props; characters should be spawned independently.\n- `foreground/source-ground-strip.png`: unmodified source crop beginning at y={ground}. `foreground/tiles/`: 128 × 64 cells in original left-to-right and top-to-bottom order. The right/bottom edge cells can contain transparent padding. Place only adjacent source cells for exact joins; arbitrary repeats and other combinations need edge cleanup. Foreground details and lighting are baked into the crop.\n- `manifest.json` records canvas, tile grid and suggested layout positions. Native scene scale is one PNG pixel per source pixel; this is concept art and does not establish an engine pixel-art grid.\n\nThe source was a flat image. The plate and props are reconstructions; they cannot recover hidden pixels or preserve an exact original composite. Reused props vary in detail and may need alpha cleanup and consistent art direction. Review in-engine before production.\n'''
 (d/'README.md').write_text(readme)
print('Built',len(scenes),'scene directories')

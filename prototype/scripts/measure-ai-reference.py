"""Read-only measurement of the original Figma eye silhouettes; no image edits."""
import json
import math
from pathlib import Path
from PIL import Image

directory = Path(__file__).resolve().parent.parent / 'docs' / 'figma-connection-recovery'
for node in ('266-43201', '266-43174', '266-43237'):
    image = Image.open(directory / (node + '-0.png')).convert('RGBA')
    pixels = image.load()
    candidates = {(x, y) for y in range(12, 43) for x in range(12, 44)
                  if (x - 28) ** 2 + (y - 28) ** 2 < 17 ** 2
                  and min(pixels[x, y][:3]) > 247 and pixels[x, y][3] > 240}
    components = []
    while candidates:
        start = candidates.pop()
        pending, component = [start], [start]
        while pending:
            x, y = pending.pop()
            for neighbor in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if neighbor in candidates:
                    candidates.remove(neighbor); pending.append(neighbor); component.append(neighbor)
        if 8 <= len(component) < 70:
            components.append({'area':len(component), 'x':sum(p[0]+.5 for p in component)/len(component),
                               'y':sum(p[1]+.5 for p in component)/len(component)})
    components.sort(key=lambda value:value['x'])
    result = {'node':node, 'eyes':components}
    if len(components) == 2:
        left,right=components
        result.update(centerX=(left['x']+right['x'])/2,centerY=(left['y']+right['y'])/2,
                      angle=math.degrees(math.atan2(right['y']-left['y'],right['x']-left['x'])))
    print(json.dumps(result))

"""
Slice all coin stage sheets with user coordinates to find the exact matching image.
"""
import os
import numpy as np
from PIL import Image

def slice_file(input_path, out_subfolder):
    os.makedirs(out_subfolder, exist_ok=True)
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    print(f"Processing {input_path} ({w}x{h})...")

    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    magenta_diff = np.sqrt((r - 255)**2 + (g - 0)**2 + (b - 255)**2)
    is_magenta = (magenta_diff < 70) | ((r > 180) & (b > 180) & (g < 170) & (r+b - 2*g > 50))
    is_white = (r > 225) & (g > 225) & (b > 225)
    is_bg = is_magenta | is_white

    arr[is_bg, 3] = 0.0

    spill = (magenta_diff < 120) & (~is_bg)
    arr[spill, 0] = np.minimum(arr[spill, 0], arr[spill, 1] + 30)
    arr[spill, 2] = np.minimum(arr[spill, 2], arr[spill, 1] + 20)

    cleaned_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    xs = [0, 527, 987, w]
    ys = [0, 370, 746, h]

    idx = 0
    for r_idx in range(3):
        for c_idx in range(3):
            x1, x2 = xs[c_idx], xs[c_idx+1]
            y1, y2 = ys[r_idx], ys[r_idx+1]

            tile = cleaned_img.crop((x1, y1, x2, y2))
            tile.save(os.path.join(out_subfolder, f"tile_{r_idx+1}_{c_idx+1}.png"), 'PNG')
            idx += 1

if __name__ == '__main__':
    for name in ['coins_stages2.png', 'coins_stages3.png', 'coins_stages4.png']:
        p = f'/Users/ayushsharma/code/life-gamify/public/assets/{name}'
        if os.path.exists(p):
            slice_file(p, f'/Users/ayushsharma/code/life-gamify/public/assets/coins/{name[:-4]}')

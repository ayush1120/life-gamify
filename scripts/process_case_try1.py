"""
Script to create a clean, transparent background PNG for case_try1.png
so it can float over any theme background in CoinVault.tsx.
"""
import numpy as np
from PIL import Image

def clean_case_try1(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # White / light background condition
    is_white_bg = (r > 240) & (g > 240) & (b > 240)

    # Edge distance for smooth anti-aliased transparency
    bg_dist = np.maximum.reduce([np.abs(r - 255.0), np.abs(g - 255.0), np.abs(b - 255.0)])
    
    alpha = np.clip((bg_dist / 30.0) * 255.0, 0, 255)
    alpha[is_white_bg] = 0.0

    arr[:, :, 3] = alpha

    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    result.save(output_path, 'PNG')
    print(f"Cleaned case_try1_transparent.png created at {output_path}")

if __name__ == '__main__':
    inp = '/Users/ayushsharma/code/life-gamify/public/assets/case_try1.png'
    out = '/Users/ayushsharma/code/life-gamify/public/assets/case_try1_transparent.png'
    clean_case_try1(inp, out)

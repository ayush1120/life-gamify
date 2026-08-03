"""
Clean magenta fringe on custom gold coin outer edge.
"""
import sys
import numpy as np
from PIL import Image

def clean_gold_coin(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    # Magenta intensity: R & B high relative to G
    magenta_intensity = np.minimum(r, b) - g

    # Pure background
    is_bg = (magenta_intensity > 35) & (g < 150)

    # Fringe
    is_fringe = (magenta_intensity > 15) & (g < 180)

    alpha = np.ones_like(r) * 255.0
    alpha[is_bg] = 0.0
    alpha[is_fringe] = np.clip(255.0 - (magenta_intensity[is_fringe] - 15) * 8.0, 0, 255)

    # Despill magenta color on edges
    remaining = (alpha > 0) & (magenta_intensity > 10)
    arr[remaining, 0] = np.minimum(arr[remaining, 0], arr[remaining, 1] + 35)
    arr[remaining, 2] = np.minimum(arr[remaining, 2], arr[remaining, 1] + 25)

    arr[:, :, 3] = alpha

    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    result.save(output_path, 'PNG')
    print(f"Cleaned coin image saved to {output_path}")

if __name__ == '__main__':
    inp = '/Users/ayushsharma/.gemini/antigravity-ide/brain/2eb1e64f-db47-4f05-8b9e-3d0b36e9b14f/custom_gold_coin_magenta_1785462052843.png'
    out = '/Users/ayushsharma/code/life-gamify/public/assets/gold_coin_transparent.png'
    clean_gold_coin(inp, out)

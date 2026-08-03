"""
Pure NumPy/PIL Pro Glass Display Case Extraction Script.
1. Creates a smooth, anti-aliased geometric mask matching the glass cylinder & pedestal base perfectly.
2. Keeps coins, pedestal, and glass specular glints 100% sharp and solid.
3. Despills magenta tint on base shadow & glass atmospheric tint into warm gold.
4. Completely cuts out all outer canvas pixels outside the case.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def extract_glass_case_pure_numpy(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    y_coords, x_coords = np.ogrid[:h, :w]

    # 1. Create precision geometric mask for glass dome + pedestal
    mask = np.zeros((h, w), dtype=np.float32)

    # Glass Cylinder Body: x from 215 to 809, y from 145 to 765
    rect_mask = (x_coords >= 215) & (x_coords <= 809) & (y_coords >= 145) & (y_coords <= 765)
    mask[rect_mask] = 1.0

    # Top Cap Ellipse: center (512, 160), rx=297, ry=52
    top_cap = (((x_coords - 512) / 297.0)**2 + ((y_coords - 160) / 52.0)**2) <= 1.0
    mask[top_cap] = 1.0

    # Pedestal Bottom Base Ellipse: center (512, 765), rx=372, ry=105
    base_1 = (((x_coords - 512) / 372.0)**2 + ((y_coords - 750) / 105.0)**2) <= 1.0
    base_2 = (((x_coords - 512) / 372.0)**2 + ((y_coords - 785) / 105.0)**2) <= 1.0
    base_3 = (((x_coords - 512) / 372.0)**2 + ((y_coords - 815) / 90.0)**2) <= 1.0
    mask[base_1 | base_2 | base_3] = 1.0

    # Convert mask to PIL Image for smooth Gaussian Blur anti-aliasing edge
    mask_img = Image.fromarray((mask * 255.0).astype(np.uint8))
    mask_blurred = mask_img.filter(ImageFilter.GaussianBlur(radius=3))
    mask_norm = np.array(mask_blurred, dtype=np.float32) / 255.0

    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Magenta key & pink tint detection
    magenta_intensity = np.minimum(r, b) - g
    magenta_spill = (magenta_intensity > 15)

    # Despill magenta on base shadow & glass reflections
    # Convert pinkish glow to warm golden/amber glow matching the pedestal light
    arr[magenta_spill, 0] = np.maximum(arr[magenta_spill, 0], arr[magenta_spill, 1] * 1.25)
    arr[magenta_spill, 2] = np.minimum(arr[magenta_spill, 2], arr[magenta_spill, 1] * 0.45)

    # Calculate final alpha
    final_alpha = mask_norm * 255.0

    # Inside glass dome, fade out pure white background pixels (y from 170 to 650)
    is_white_bg = (r > 240) & (g > 240) & (b > 240)
    interior_white = is_white_bg & (mask_norm > 0.5) & (y_coords > 170) & (y_coords < 650)
    final_alpha[interior_white] = 85.0 # 33% glass opacity

    arr[:, :, 3] = final_alpha

    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    result.save(output_path, 'PNG')
    print(f"Pure NumPy/PIL glass case asset successfully created at {output_path}")

if __name__ == '__main__':
    inp = '/Users/ayushsharma/code/life-gamify/public/assets/case.png'
    out = '/Users/ayushsharma/code/life-gamify/public/assets/case_transparent.png'
    extract_glass_case_pure_numpy(inp, out)

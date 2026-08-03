"""
Analyze coin sprite sheet gaps and slice exactly into 9 coin images.
"""
import os
import numpy as np
from PIL import Image

def slice_exact_9_coins(input_path, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size

    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Background detection: white background (R>230, G>230, B>230) or magenta halo (R>180, B>180, G<200)
    magenta_intensity = np.minimum(r, b) - g
    is_magenta = (magenta_intensity > 25) & (g < 200)
    is_white = (r > 220) & (g > 220) & (b > 220)
    is_bg = is_magenta | is_white

    # Alpha mask
    arr[is_bg, 3] = 0.0

    # Despill magenta color on edge pixels
    fringe = (magenta_intensity > 10) & (~is_bg)
    arr[fringe, 0] = np.minimum(arr[fringe, 0], arr[fringe, 1] + 35)
    arr[fringe, 2] = np.minimum(arr[fringe, 2], arr[fringe, 1] + 25)

    cleaned_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    # Grid parameters based on visual layout of 1536x1024 sprite sheet:
    # 3 rows, 3 columns
    # Center of coins:
    # Col centers roughly: 256, 768, 1280
    # Row centers roughly: 170, 512, 854
    # Radius ~ 200px for circular coins, and ~ 220px wide for 3D oval coins at bottom
    
    col_centers = [256, 768, 1280]
    row_centers = [170, 512, 850]

    coin_names = [
        "coin_stage_1_seedling.png",
        "coin_stage_2_sapling.png",
        "coin_stage_3_growing.png",
        "coin_stage_4_full_tree.png",
        "coin_stage_5_golden_coins.png",
        "coin_stage_6_harvest.png",
        "coin_angle_top.png",
        "coin_angle_iso.png",
        "coin_angle_side.png",
    ]

    idx = 0
    for r_idx, cy in enumerate(row_centers):
        for c_idx, cx in enumerate(col_centers):
            # Crop box around center
            box_w = 440
            box_h = 320 if r_idx < 2 else 260

            x1 = max(0, cx - box_w // 2)
            x2 = min(w, cx + box_w // 2)
            y1 = max(0, cy - box_h // 2)
            y2 = min(h, cy + box_h // 2)

            tile = cleaned_img.crop((x1, y1, x2, y2))
            tile_arr = np.array(tile)

            # Auto-trim transparent edges
            alpha_tile = tile_arr[:, :, 3]
            non_zero = np.where(alpha_tile > 10)
            if len(non_zero[0]) > 0:
                min_y, max_y = np.min(non_zero[0]), np.max(non_zero[0])
                min_x, max_x = np.min(non_zero[1]), np.max(non_zero[1])

                pad = 8
                min_y = max(0, min_y - pad)
                max_y = min(tile.height, max_y + pad)
                min_x = max(0, min_x - pad)
                max_x = min(tile.width, max_x + pad)

                tile = tile.crop((min_x, min_y, max_x, max_y))

            out_name = coin_names[idx]
            out_path = os.path.join(output_dir, out_name)
            tile.save(out_path, 'PNG')
            print(f"[{idx+1}/9] Saved {out_name}: {tile.size[0]}x{tile.size[1]} px")
            idx += 1

    # Save full cleaned sheet
    cleaned_img.save(os.path.join(output_dir, 'coin_sheet_transparent.png'), 'PNG')

if __name__ == '__main__':
    inp = '/Users/ayushsharma/code/life-gamify/public/assets/coin.png'
    out_dir = '/Users/ayushsharma/code/life-gamify/public/assets/coins'
    slice_exact_9_coins(inp, out_dir)

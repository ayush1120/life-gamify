"""
Slice coin sheet using exact user coordinates with component isolation to prevent bleed.
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import label

def slice_clean_tiles(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    
    possible_inputs = [
        '/Users/ayushsharma/code/life-gamify/public/assets/coin.png',
        '/Users/ayushsharma/code/life-gamify/public/assets/coins_stages2.png'
    ]

    input_path = None
    for p in possible_inputs:
        if os.path.exists(p):
            input_path = p
            break

    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    print(f"Using input image: {input_path} ({w}x{h} px)")

    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Background detection
    magenta_diff = np.sqrt((r - 255)**2 + (g - 0)**2 + (b - 255)**2)
    is_magenta = (magenta_diff < 70) | ((r > 180) & (b > 180) & (g < 170) & (r+b - 2*g > 50))
    is_white = (r > 225) & (g > 225) & (b > 225)
    is_bg = is_magenta | is_white

    arr[is_bg, 3] = 0.0

    # Despill magenta color on edge pixels
    spill = (magenta_diff < 120) & (~is_bg)
    arr[spill, 0] = np.minimum(arr[spill, 0], arr[spill, 1] + 30)
    arr[spill, 2] = np.minimum(arr[spill, 2], arr[spill, 1] + 20)

    cleaned_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    # User coordinates
    xs = [0, 527, 987, w]
    ys = [0, 370, 746, h]

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
    for r_idx in range(3):
        for c_idx in range(3):
            x1, x2 = xs[c_idx], xs[c_idx+1]
            y1, y2 = ys[r_idx], ys[r_idx+1]

            tile = cleaned_img.crop((x1, y1, x2, y2))
            tile_arr = np.array(tile)

            # Connected component isolation: keep ONLY the largest connected component in this tile
            fg = tile_arr[:, :, 3] > 20
            labeled, num_features = label(fg)

            if num_features > 0:
                # Find sizes of all components
                sizes = [np.sum(labeled == i) for i in range(1, num_features + 1)]
                largest_label = np.argmax(sizes) + 1

                # Mask out any smaller stray components (like neighboring coin bleed)
                tile_arr[labeled != largest_label, 3] = 0

                # Crop tightly to the largest component
                non_zero = np.where(tile_arr[:, :, 3] > 20)
                min_y, max_y = np.min(non_zero[0]), np.max(non_zero[0])
                min_x, max_x = np.min(non_zero[1]), np.max(non_zero[1])

                tile = Image.fromarray(tile_arr).crop((min_x, min_y, max_x + 1, max_y + 1))

            out_name = coin_names[idx]
            out_path = os.path.join(output_dir, out_name)
            tile.save(out_path, 'PNG')
            print(f"[{idx+1}/9] Saved {out_name}: {tile.size[0]}x{tile.size[1]} px")
            idx += 1

if __name__ == '__main__':
    out_dir = '/Users/ayushsharma/code/life-gamify/public/assets/coins'
    slice_clean_tiles(out_dir)

"""
Border Flood-Fill Glass Display Case Background Removal Script.
Uses BFS starting strictly from outer canvas edges so glass reflections inside the dome stay 100% intact.
"""
import sys
import numpy as np
from PIL import Image
from collections import deque

def flood_fill_case_bg(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Magenta key detection
    magenta_intensity = np.minimum(r, b) - g
    magenta_dist = np.sqrt((r - 255)**2 + (g - 0)**2 + (b - 254)**2)

    # Pixel is candidate background if:
    # - Bright white background (R>235 & G>235 & B>235)
    # - Magenta background (dist < 80 or magenta_intensity > 25)
    # - Pinkish outer glow aura (R>200, G<180, B>180 on outer edges)
    is_white_bg = (r > 235) & (g > 235) & (b > 235)
    is_magenta_bg = (magenta_dist < 80) | ((magenta_intensity > 25) & (g < 170))
    is_pink_aura = (r > 190) & (b > 160) & (g < 175) & (r > g + 25)

    is_bg_candidate = is_white_bg | is_magenta_bg | is_pink_aura

    # BFS flood fill starting from outer border pixels
    bg_mask = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Enqueue border pixels
    for x in range(w):
        for y in (0, h - 1):
            if is_bg_candidate[y, x]:
                queue.append((y, x))
                visited[y, x] = True
                bg_mask[y, x] = True

    for y in range(h):
        for x in (0, w - 1):
            if not visited[y, x] and is_bg_candidate[y, x]:
                queue.append((y, x))
                visited[y, x] = True
                bg_mask[y, x] = True

    # 4-connectivity BFS
    neighbors = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in neighbors:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if is_bg_candidate[ny, nx]:
                    bg_mask[ny, nx] = True
                    queue.append((ny, nx))

    # Convert bg_mask to alpha
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[bg_mask] = 0.0

    # Despill magenta/pink on border edges & pedestal base
    spill = (magenta_intensity > 10) & (~bg_mask)
    arr[spill, 0] = np.minimum(arr[spill, 0], arr[spill, 1] + 30)
    arr[spill, 2] = np.minimum(arr[spill, 2], arr[spill, 1] + 20)

    arr[:, :, 3] = alpha

    result = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    result.save(output_path, 'PNG')
    print(f"BFS flood-filled transparent glass case saved to: {output_path}")

if __name__ == '__main__':
    inp = '/Users/ayushsharma/code/life-gamify/public/assets/case.png'
    out = '/Users/ayushsharma/code/life-gamify/public/assets/case_transparent.png'
    flood_fill_case_bg(inp, out)

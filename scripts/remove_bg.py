"""
Smart background removal for 3D rendered assets.
Uses flood-fill from corners to identify background, then applies
smooth alpha feathering at edges for seamless compositing.
"""
import sys
import numpy as np
from PIL import Image
from collections import deque

def remove_background(input_path, output_path, tolerance=35, feather_px=6):
    """Remove background using flood-fill from corners + edge feathering."""
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size
    pixels = np.array(img)
    
    # Extract RGB
    rgb = pixels[:, :, :3].astype(np.float32)
    
    # Sample bg colour from the four corners (average a 10x10 patch from each)
    patch = 10
    corners = [
        rgb[0:patch, 0:patch],           # top-left
        rgb[0:patch, w-patch:w],          # top-right
        rgb[h-patch:h, 0:patch],          # bottom-left
        rgb[h-patch:h, w-patch:w],        # bottom-right
    ]
    bg_color = np.mean(np.concatenate([c.reshape(-1, 3) for c in corners], axis=0), axis=0)
    print(f"  Detected bg colour: RGB({bg_color[0]:.0f}, {bg_color[1]:.0f}, {bg_color[2]:.0f})")
    
    # Create mask: 1 = background, 0 = foreground
    # Use colour distance from bg_color
    diff = np.sqrt(np.sum((rgb - bg_color) ** 2, axis=2))
    
    # Flood-fill from all four corners
    visited = np.zeros((h, w), dtype=bool)
    bg_mask = np.zeros((h, w), dtype=bool)
    
    queue = deque()
    # Seed from corner pixels
    seeds = [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]
    # Also seed from edges every 20 pixels
    for x in range(0, w, 20):
        seeds.extend([(0, x), (h-1, x)])
    for y in range(0, h, 20):
        seeds.extend([(y, 0), (y, w-1)])
    
    for sy, sx in seeds:
        if not visited[sy, sx] and diff[sy, sx] < tolerance:
            queue.append((sy, sx))
            visited[sy, sx] = True
    
    # BFS flood fill
    while queue:
        cy, cx = queue.popleft()
        bg_mask[cy, cx] = True
        
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if diff[ny, nx] < tolerance:
                    queue.append((ny, nx))
    
    print(f"  Background pixels: {bg_mask.sum()} / {w*h} ({100*bg_mask.sum()/(w*h):.1f}%)")
    
    # Create alpha channel: 255 for foreground, 0 for background
    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)
    
    # Apply edge feathering using distance-based alpha blending
    # For pixels near the bg/fg boundary, create smooth transition
    if feather_px > 0:
        from scipy.ndimage import distance_transform_edt
        # Distance from background for foreground pixels
        fg_dist = distance_transform_edt(~bg_mask)
        # Smooth feathering
        feather_alpha = np.clip(fg_dist / feather_px, 0, 1)
        alpha = (feather_alpha * 255).astype(np.uint8)
    
    # Set alpha
    pixels[:, :, 3] = alpha
    
    # Save
    result = Image.fromarray(pixels)
    result.save(output_path, 'PNG')
    print(f"  Saved: {output_path}")

if __name__ == '__main__':
    assets = '/Users/ayushsharma/code/life-gamify/public/assets'
    
    print("Processing chest_dark.png...")
    remove_background(f'{assets}/chest_dark.png', f'{assets}/chest_transparent.png', tolerance=30, feather_px=4)
    
    print("\nProcessing dome_dark.png...")
    remove_background(f'{assets}/dome_dark.png', f'{assets}/dome_transparent.png', tolerance=28, feather_px=4)

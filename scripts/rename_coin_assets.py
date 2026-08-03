"""
Script to organize, rename, and document all coin asset PNG files into descriptive names.
"""
import os
import shutil

BASE_DIR = '/Users/ayushsharma/code/life-gamify/public/assets/coins'

mapping = {
    # Stage 1: 2D Growth Sequence
    'coin_stage_1/tile_r1_c2_339x333.png': 'stage_1_seedling_front.png',
    'coin_stage_1/tile_r1_c4_329x333.png': 'stage_2_sapling_front.png',
    'coin_stage_1/tile_r1_c6_337x333.png': 'stage_3_young_tree_front.png',
    'coin_stage_1/tile_r2_c2_339x338.png': 'stage_4_growing_canopy_front.png',
    'coin_stage_1/tile_r2_c4_329x338.png': 'stage_5_full_canopy_front.png',
    'coin_stage_1/tile_r2_c6_337x338.png': 'stage_6_coin_harvest_front.png',
    'coin_stage_1/tile_r3_c2_339x353.png': 'stage_7_abundant_harvest_front.png',
    'coin_stage_1/tile_r3_c4_329x353.png': 'stage_8_glowing_harvest_front.png',
    'coin_stage_1/tile_r3_c6_337x353.png': 'stage_9_radiant_harvest_front.png',

    # Stage 2: 3D Multi-Angle & Edge Profiles
    'coin_stage_2/tile_r1_c2_404x411.png': 'coin_3d_angle_left_45deg.png',
    'coin_stage_2/tile_r1_c4_416x411.png': 'coin_3d_front_0deg.png',
    'coin_stage_2/tile_r1_c6_375x411.png': 'coin_3d_angle_right_45deg.png',
    'coin_stage_2/tile_r2_c2_404x249.png': 'coin_3d_side_edge_90deg.png',
    'coin_stage_2/tile_r2_c4_416x249.png': 'coin_3d_angle_top_down_75deg.png',
    'coin_stage_2/tile_r2_c6_375x249.png': 'coin_3d_angle_steep_right_60deg.png',
    'coin_stage_2/tile_r3_c2_404x364.png': 'coin_3d_thick_rim_isometric.png',
    'coin_stage_2/tile_r3_c4_416x364.png': 'coin_3d_blank_gold_base.png',
    'coin_stage_2/tile_r3_c6_375x364.png': 'coin_3d_slanted_side_profile.png',

    # Stage 3: Rotation Sequence & Base Templates
    'coin_stage_3/image1.png': 'rotation_01_left_45deg.png',
    'coin_stage_3/tile_r2_c4_280x294.png': 'rotation_02_left_15deg.png',
    'coin_stage_3/tile_r2_c6_277x294.png': 'rotation_03_front_0deg.png',
    'coin_stage_3/tile_r2_c8_269x294.png': 'rotation_04_right_15deg.png',
    'coin_stage_3/tile_r2_c10_250x294.png': 'rotation_05_right_45deg.png',

    'coin_stage_3/tile_r3_c2_247x276.png': 'reverse_base_side_left.png',
    'coin_stage_3/tile_r3_c4_264x276.png': 'reverse_base_angle_left_45deg.png',
    'coin_stage_3/tile_r3_c6_272x276.png': 'reverse_base_front_0deg.png',
    'coin_stage_3/tile_r3_c8_264x276.png': 'reverse_base_angle_right_45deg.png',
    'coin_stage_3/tile_r3_c10_261x276.png': 'reverse_base_side_right.png',

    'coin_stage_3/tile_r4_c2_321x201.png': 'perspective_flat_angle_left.png',
    'coin_stage_3/tile_r4_c4_286x225.png': 'perspective_flat_angle_front.png',
    'coin_stage_3/tile_r4_c7_310x221.png': 'perspective_flat_angle_right.png',
    'coin_stage_3/tile_r4_c10_298x198.png': 'perspective_flat_edge_horizontal.png',

    'coin_stage_3/tile_r5_c2_245x233.png': 'spin_sequence_steep_tilt_left.png',
    'coin_stage_3/tile_r5_c3_204x233.png': 'spin_sequence_edge_left.png',
    'coin_stage_3/tile_r5_c4_387x209.png': 'spin_sequence_flat_tilt_front.png',
    'coin_stage_3/tile_r5_c7_259x236.png': 'spin_sequence_steep_tilt_right.png',
    'coin_stage_3/tile_r5_c10_236x236.png': 'spin_sequence_edge_right.png',
}

def rename_all():
    print("Renaming and copying files...")
    for old_rel, new_name in mapping.items():
        src = os.path.join(BASE_DIR, old_rel)
        dst = os.path.join(BASE_DIR, old_rel.split('/')[0], new_name)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"✅ Renamed: {old_rel} -> {new_name}")
        else:
            print(f"⚠️ Warning: file not found: {src}")

if __name__ == '__main__':
    rename_all()

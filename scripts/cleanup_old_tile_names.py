"""
Script to clean up old tile_* and image1.png copies from public/assets/coins/
leaving ONLY the descriptive filenames.
"""
import os
import glob

BASE_DIR = '/Users/ayushsharma/code/life-gamify/public/assets/coins'

def remove_old_copies():
    print("Cleaning up old tile_* and image1.png copies...")
    old_files = []
    
    # Find all tile_* and image1.png files
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.startswith('tile_') or f == 'image1.png':
                old_files.append(os.path.join(root, f))

    print(f"Found {len(old_files)} old copy files to remove:")
    for filepath in old_files:
        os.remove(filepath)
        print(f"  🗑️ Deleted: {os.path.basename(filepath)}")

    print(f"Cleanup complete! Removed {len(old_files)} files.")

if __name__ == '__main__':
    remove_old_copies()

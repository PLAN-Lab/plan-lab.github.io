#!/usr/bin/env python3
"""
Script to convert publication images to square format with white padding.
Takes image filenames from the images/publications folder and saves them as square images.
"""

import os
from PIL import Image, ImageOps

# Input: List of image filenames from images/publications folder
IMAGE_FILENAMES = [
    "mocha.png",
    "purpcode.png", 
    "sreasoner.png",
    "mtsbench.png",
    "hallusegbench.png",
    "part2gs.gif",
    "latteflow.png"
]

def make_square_with_padding(image_path, output_path):
    """
    Convert an image to square format by adding white padding.
    
    Args:
        image_path (str): Path to the input image
        output_path (str): Path to save the square image
    """
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get current dimensions
            width, height = img.size
            
            # Determine the size of the square (max of width and height)
            max_size = max(width, height)
            
            # Create a new square image with white background
            square_img = Image.new('RGB', (max_size, max_size), (255, 255, 255))
            
            # Calculate position to center the original image
            x_offset = (max_size - width) // 2
            y_offset = (max_size - height) // 2
            
            # Paste the original image onto the square canvas
            square_img.paste(img, (x_offset, y_offset))
            
            # Save the square image
            square_img.save(output_path, quality=95, optimize=True)
            print(f"✓ Converted: {os.path.basename(image_path)} -> {os.path.basename(output_path)}")
            
    except Exception as e:
        print(f"✗ Error processing {image_path}: {str(e)}")

def main():
    """Main function to process all images in the list."""
    # Define paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_dir = os.path.join(base_dir, '..', "images", "publications")
    output_dir = os.path.join(base_dir, '..', "images", "publications")
    
    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f"Error: Input directory does not exist: {input_dir}")
        return
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    print("Converting images to square format with white padding...")
    print("-" * 60)
    
    processed = 0
    skipped = 0
    
    for filename in IMAGE_FILENAMES:
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)
        
        # Check if input file exists
        if not os.path.exists(input_path):
            print(f"⚠ Skipped: {filename} (file not found)")
            skipped += 1
            continue
        
        # Process the image
        make_square_with_padding(input_path, output_path)
        processed += 1
    
    print("-" * 60)
    print(f"Processing complete!")
    print(f"Processed: {processed} images")
    print(f"Skipped: {skipped} images")

if __name__ == "__main__":
    main()

#!/bin/bash
# pixelate.sh
#
# This script processes image files in a directory by converting them to grayscale
# and then pixelating them. Pixelation is achieved by scaling the image down (reducing
# its resolution) and then scaling it back up.
#
# Usage: ./pixelate.sh [PIXEL_BLOCK_SIZE] [directory]
#   PIXEL_BLOCK_SIZE: How many original pixels per pixel block (default is 10)
#   directory: Directory containing the images (default is current directory)

# Get the pixel block size (i.e. how many pixels wide each block should be)
PIXEL_SIZE="${1:-10}"

# Get the directory to process (default to current directory)
DIR="${2:-.}"

# Check if the directory exists
if [ ! -d "$DIR" ]; then
    echo "Error: Directory '$DIR' does not exist."
    exit 1
fi

# Enable nullglob so that non-matching globs expand to nothing
shopt -s nullglob

# Process image files with common extensions
for file in "$DIR"/*.jpg "$DIR"/*.jpeg "$DIR"/*.png "$DIR"/*.gif; do
    # Get the filename components for constructing an output name.
    base=$(basename "$file")
    ext="${base##*.}"
    name="${base%.*}"
    
    # If the file name already contains ".pixelated.", we process in place.
    if [[ "$base" == *".pixelated."* ]]; then
        output="$file"
        # Use a temporary file to store the conversion output
        temp_file="${file}.tmp"
    else
        output="$DIR/${name}.pixelated.${ext}"
    fi

    # Get image dimensions using ImageMagick's identify.
    width=$(identify -format "%w" "$file")
    height=$(identify -format "%h" "$file")

    if [ -z "$width" ] || [ -z "$height" ]; then
        echo "Could not determine dimensions for $file. Skipping."
        continue
    fi

    # Compute new dimensions by dividing the original dimensions by PIXEL_SIZE.
    new_width=$(( width / PIXEL_SIZE ))
    new_height=$(( height / PIXEL_SIZE ))

    # Ensure the new dimensions are at least 1 pixel.
    if [ $new_width -lt 1 ]; then new_width=1; fi
    if [ $new_height -lt 1 ]; then new_height=1; fi

    echo "Processing $file: ${width}x${height} -> ${new_width}x${new_height} -> $output"

    # Convert the image:
    #   -colorspace Gray converts the image to grayscale.
    #   -scale down then -scale back up creates the pixelation effect.
    if [[ "$base" == *".pixelated."* ]]; then
        # Convert and write to a temporary file, then move to overwrite original
        convert "$file" -colorspace Gray -scale "${new_width}x${new_height}!" -scale "${width}x${height}!" "$temp_file"
        if [ $? -eq 0 ]; then
            mv "$temp_file" "$file"
            echo "Overwritten pixelated image: $file"
        else
            echo "Conversion failed for $file"
            rm -f "$temp_file"
        fi
    else
        convert "$file" -colorspace Gray -scale "${new_width}x${new_height}!" -scale "${width}x${height}!" "$output"
        echo "Saved pixelated image to $output"
    fi
done

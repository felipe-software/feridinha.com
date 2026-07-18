#!/bin/bash
# get_random_data.sh
#
# This script generates a file filled with random data from /dev/random.
# The output file is named according to the input size (e.g. "1mb.png").
#
# Usage:
#   ./get_random_data.sh <size>
#
# Examples:
#   ./get_random_data.sh 5mb
#   ./get_random_data.sh 1200kb

# Ensure exactly one argument is provided.
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <size>"
  echo "Example: $0 1mb"
  exit 1
fi

size_arg="$1"

# Extract the numeric part and the unit part.
num=$(echo "$size_arg" | grep -o '^[0-9]\+')
unit=$(echo "$size_arg" | grep -o '[a-zA-Z]\+$' | tr '[:upper:]' '[:lower:]')

if [ -z "$num" ] || [ -z "$unit" ]; then
  echo "Invalid size format: $size_arg"
  exit 1
fi

# Determine the multiplier based on the unit.
case "$unit" in
  b)
    factor=1
    ;;
  k|kb)
    factor=1024
    ;;
  m|mb)
    factor=$((1024 * 1024))
    ;;
  g|gb)
    factor=$((1024 * 1024 * 1024))
    ;;
  t|tb)
    factor=$((1024 * 1024 * 1024 * 1024))
    ;;
  *)
    echo "Unknown unit: $unit. Allowed units: b, kb, mb, gb, tb"
    exit 1
    ;;
esac

# Calculate total number of bytes to generate.
target_bytes=$(( num * factor ))
echo "Target: $target_bytes bytes of random data."

# Define the output file (name based on the input argument).
output_file="${size_arg}.png"

# Empty or create the output file.
> "$output_file"

# Define the chunk size (default 1 MB).
chunk_size=$((1024 * 1024))
if [ "$target_bytes" -lt "$chunk_size" ]; then
  chunk_size=$target_bytes
fi

remaining=$target_bytes

# Loop until we have written the target number of bytes.
while [ "$remaining" -gt 0 ]; do
  # Determine the current chunk size (the smaller of remaining or chunk_size).
  if [ "$remaining" -lt "$chunk_size" ]; then
    current_chunk=$remaining
  else
    current_chunk=$chunk_size
  fi

  # Read current_chunk bytes from /dev/random into a temporary file.
  dd if=/dev/random bs=$current_chunk count=1 of=temp_chunk.bin status=none

  # Append the temporary chunk to the output file.
  cat temp_chunk.bin >> "$output_file"

  # Update the remaining byte count.
  remaining=$(( remaining - current_chunk ))
  echo "Added $current_chunk bytes, $remaining bytes remaining."
done

# Remove the temporary file.
rm -f temp_chunk.bin

# Display the final file size.
# On Linux, use:
final_size=$(stat -c%s "$output_file")
# For macOS, you might use:
# final_size=$(stat -f%z "$output_file")
echo "Finished. Created '$output_file' with size: $final_size bytes."

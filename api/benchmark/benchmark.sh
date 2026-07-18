#!/bin/bash
# upload_benchmark.sh
#
# This script performs a GET request (ping) to the domain extracted from the provided URL,
# measures and prints the response time, then reads all files from the "./files" folder,
# sorts them by file size (ascending), uploads each file to the provided URL,
# extracts the "message" field from the JSON response, and appends that message (on a new line)
# to "./upload_list.txt".
#
# Usage:
#   ./upload_benchmark.sh <upload_url>
#
# Example:
#   ./upload_benchmark.sh http://mysite.com/upload

# --- Argument and Directory Checks ---

# Check that exactly one argument (the upload URL) is provided.
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <upload_url>"
  exit 1
fi

UPLOAD_URL="$1"
FILES_DIR="./files"
OUTPUT_LIST="./upload_list.txt"

# Check that the files directory exists.
if [ ! -d "$FILES_DIR" ]; then
  echo "Error: Directory '$FILES_DIR' does not exist."
  exit 1
fi

# Check that jq is installed.
if ! command -v jq > /dev/null 2>&1; then
  echo "Error: jq is not installed. Please install jq to parse JSON output."
  exit 1
fi

# --- Domain "Ping" ---

# Extract the domain endpoint from the upload URL.
# This extracts the optional scheme (http:// or https://) and the domain part before the next slash.
if [[ "$UPLOAD_URL" =~ ^(https?://)?([^/]+) ]]; then
  scheme="${BASH_REMATCH[1]}"
  domain="${BASH_REMATCH[2]}"
  # If no scheme was provided, assume http://.
  if [ -z "$scheme" ]; then
    scheme="http://"
  fi
  DOMAIN_URL="${scheme}${domain}"
else
  # If we cannot parse, just use the upload URL as a fallback.
  DOMAIN_URL="$UPLOAD_URL"
fi

echo "Pinging domain endpoint: $DOMAIN_URL"

# Measure the GET request time (ping) for the domain.
ping_start=$(date +%s%3N)
curl -s -o /dev/null "$DOMAIN_URL"
ping_end=$(date +%s%3N)
ping_duration=$(( ping_end - ping_start ))

echo "Ping to $DOMAIN_URL: ${ping_duration} ms"
echo "-------------------------------------------"

# --- Prepare the Output File ---

# Clear the upload list file.
> "$OUTPUT_LIST"

# --- Process and Upload Files ---

# Use GNU find to list all regular files with their sizes, sort by size (ascending),
# then process each file.
find "$FILES_DIR" -maxdepth 1 -type f -printf "%s %p\n" | sort -n | while read -r filesize file; do
  # Double-check the file exists.
  if [ ! -f "$file" ]; then
    continue
  fi

  # Record the start time (in ms) for the upload.
  upload_start=$(date +%s%3N)

  # Upload the file using curl; the file is sent as a form field named "file".
  # Capture the JSON response.
  response=$(curl -s -F "file=@$file" "$UPLOAD_URL")

  # Record the end time.
  upload_end=$(date +%s%3N)
  upload_duration=$(( upload_end - upload_start ))

  # Extract the "message" field from the JSON response.
  message=$(echo "$response" | jq -r '.message')

  # Append the message to the output list file.
  echo "$message" >> "$OUTPUT_LIST"

  # Print the details to the terminal.
  echo "File: $(basename "$file"), Size: ${filesize} bytes, Upload time: ${upload_duration} ms, Message: $message"
done

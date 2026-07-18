#!/bin/bash

# Endpoint URL
UPLOAD_URL="http://localhost:9999/upload"

# File to upload
FILE_PATH="./files/loop_target.jpg"

random_sleep() {
    # Generate random number between 0-10 seconds
    sleep_time=$((RANDOM % 11))  # 0-10 inclusive
    echo "Sleeping for ${sleep_time} seconds..."
    sleep ${sleep_time}
}

# Infinite loop with random intervals
while true; do
    # Send POST request with curl
    echo "$(date) - Uploading file..."
    curl -X POST -F "file=@${FILE_PATH}" "${UPLOAD_URL}"
    
    # Wait random time before next upload
    sleep 1
    echo
done
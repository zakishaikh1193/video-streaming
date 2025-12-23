#!/bin/bash

echo "========================================"
echo "Bulk Video Import SQL Generator"
echo "========================================"
echo ""

# Check if CSV path is provided
if [ -z "$1" ]; then
    echo "Usage: ./generate-bulk-import.sh path/to/ICTVideosList.csv"
    echo ""
    echo "Example:"
    echo "  ./generate-bulk-import.sh 'y:/Standard ICT/Digital Assets/ICTVideosList.csv'"
    echo ""
    exit 1
fi

echo "Generating SQL dump from: $1"
echo ""

cd backend/scripts
node generateBulkVideoSQL.js "$1"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "SQL dump generated successfully!"
    echo "========================================"
    echo ""
    echo "Output file: ../../bulk_videos_import.sql"
    echo ""
    echo "Next steps:"
    echo "1. Review the SQL file"
    echo "2. Ensure video files are in backend/upload/ folder"
    echo "3. Ensure QR codes are in qr-codes/ folder"
    echo "4. Import the SQL file into your database"
    echo ""
else
    echo ""
    echo "========================================"
    echo "Error generating SQL dump!"
    echo "========================================"
    echo ""
    exit 1
fi





import path from "path"
import fs from "fs/promises"
import { fetch } from "bun";

async function measurePing(domain: string) {
    const start = performance.now();
    await fetch(domain);
    return performance.now() - start;
}

async function uploadFile(filePath: string, url: string) {
    const formData = new FormData();
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    
    formData.append('file', new Blob([fileBuffer]), fileName);
    
    const start = performance.now();
    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });
    const duration = performance.now() - start;
    
    return {
        fileName,
        size: fileBuffer.length,
        duration,
        status: response.status
    };
}

async function benchmark(uploadUrl: string) {
    if (!uploadUrl) {
        throw new Error('Usage: node benchmark.js <upload-url>');
    }

    try {
        // Measure ping
        console.log(`Testing uploads to: ${uploadUrl}`);
        console.log('Measuring ping...');
        const ping = await measurePing(new URL(uploadUrl).origin);
        console.log(`Ping: ${ping.toFixed(2)}ms\n`);

        // Get all files from upload directory
        const files = await fs.readdir('./files') as string[];
        const fileStats = await Promise.all(
            files.map(async file => ({
                path: path.join('./files', file),
                size: (await fs.stat(path.join('./files', file))).size
            }))
        );

        // Sort files by size
        fileStats.sort((a, b) => a.size - b.size);

        console.log('Starting file uploads...\n');

        // Upload files sequentially
        for (const file of fileStats) {
            try {
                const result = await uploadFile(file.path, uploadUrl);
                console.log(`File: ${result.fileName}`);
                console.log(`Size: ${(result.size / 1024).toFixed(2)} KB`);
                console.log(`Upload time: ${(result.duration / 1000).toFixed(2)}s`);
                console.log(`Status: ${result.status}`);
                console.log('-------------------');
            } catch (error) {
                console.error(`Failed to upload ${file.path}:`, error);
                console.log('-------------------');
            }
        }

    } catch (error) {
        console.error('Benchmark failed:', error);
    }
}

// Get URL from command line argument
const uploadUrl = process.argv[2];

if (!uploadUrl) {
    console.error('Error: Upload URL is required');
    console.error('Usage: node benchmark.js <upload-url>');
    process.exit(1);
}

benchmark(uploadUrl);
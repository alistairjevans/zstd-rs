#!/usr/bin/env node
/**
 * WASM Benchmark Runner for ruzstd decompression
 *
 * Compares performance between non-SIMD and SIMD versions.
 *
 * Usage:
 *   node run_benchmark.mjs [iterations]
 *
 * Prerequisites:
 *   1. Build both versions:
 *      cargo build -p wasm-bench --target wasm32-unknown-unknown --release
 *      RUSTFLAGS="-Ctarget-feature=+simd128" cargo build -p wasm-bench --target wasm32-unknown-unknown --release --features simd
 *
 *   2. Generate bindings:
 *      wasm-bindgen target/wasm32-unknown-unknown/release/wasm_bench.wasm --out-dir wasm-bench/pkg-no-simd --target nodejs
 *      wasm-bindgen target/wasm32-unknown-unknown/release/wasm_bench.wasm --out-dir wasm-bench/pkg-simd --target nodejs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const WARMUP_ITERATIONS = 3;
const DEFAULT_ITERATIONS = 10;

async function runBenchmark(name, wasmModule, iterations) {
    const compressedSize = wasmModule.get_compressed_size();

    // Warmup
    console.log(`  Warming up (${WARMUP_ITERATIONS} iterations)...`);
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        wasmModule.decompress_once();
    }

    // Run benchmark
    console.log(`  Running ${iterations} iterations...`);
    const times = [];
    let totalBytes = 0;

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const bytes = wasmModule.decompress_once();
        const end = performance.now();
        times.push(end - start);
        totalBytes += bytes;
    }

    // Calculate statistics
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];

    // Calculate throughput (MB/s)
    const bytesPerIteration = totalBytes / iterations;
    const throughputMBps = (bytesPerIteration / (1024 * 1024)) / (mean / 1000);

    return {
        name,
        compressedSize,
        decompressedSize: bytesPerIteration,
        iterations,
        min,
        max,
        mean,
        median,
        throughputMBps,
        simdEnabled: wasmModule.is_simd_enabled()
    };
}

function printResults(results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${results.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`  SIMD Enabled:      ${results.simdEnabled}`);
    console.log(`  Compressed Size:   ${(results.compressedSize / 1024).toFixed(2)} KB`);
    console.log(`  Decompressed Size: ${(results.decompressedSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Iterations:        ${results.iterations}`);
    console.log(`  Time (min):        ${results.min.toFixed(2)} ms`);
    console.log(`  Time (max):        ${results.max.toFixed(2)} ms`);
    console.log(`  Time (mean):       ${results.mean.toFixed(2)} ms`);
    console.log(`  Time (median):     ${results.median.toFixed(2)} ms`);
    console.log(`  Throughput:        ${results.throughputMBps.toFixed(2)} MB/s`);
}

function printComparison(noSimd, simd) {
    const speedup = noSimd.mean / simd.mean;
    const throughputImprovement = ((simd.throughputMBps / noSimd.throughputMBps) - 1) * 100;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`COMPARISON`);
    console.log(`${'='.repeat(60)}`);
    console.log(`  Speedup:              ${speedup.toFixed(2)}x`);
    console.log(`  Throughput gain:      ${throughputImprovement >= 0 ? '+' : ''}${throughputImprovement.toFixed(1)}%`);
    console.log(`  Time saved per iter:  ${(noSimd.mean - simd.mean).toFixed(2)} ms`);
}

async function main() {
    const iterations = parseInt(process.argv[2]) || DEFAULT_ITERATIONS;

    console.log('WASM Decompression Benchmark');
    console.log('============================\n');

    // Load modules
    let noSimdModule, simdModule;

    try {
        console.log('Loading non-SIMD module...');
        noSimdModule = require(join(__dirname, 'pkg-no-simd', 'wasm_bench.js'));
    } catch (e) {
        console.error('Failed to load non-SIMD module. Did you build it?');
        console.error('Run: cargo build -p wasm-bench --target wasm32-unknown-unknown --release');
        console.error('Then: wasm-bindgen target/wasm32-unknown-unknown/release/wasm_bench.wasm --out-dir wasm-bench/pkg-no-simd --target nodejs');
        process.exit(1);
    }

    try {
        console.log('Loading SIMD module...');
        simdModule = require(join(__dirname, 'pkg-simd', 'wasm_bench.js'));
    } catch (e) {
        console.error('Failed to load SIMD module. Did you build it?');
        console.error('Run: RUSTFLAGS="-Ctarget-feature=+simd128" cargo build -p wasm-bench --target wasm32-unknown-unknown --release --features simd');
        console.error('Then: wasm-bindgen target/wasm32-unknown-unknown/release/wasm_bench.wasm --out-dir wasm-bench/pkg-simd --target nodejs');
        process.exit(1);
    }

    // Run benchmarks
    console.log('\nRunning non-SIMD benchmark...');
    const noSimdResults = await runBenchmark('Non-SIMD Version', noSimdModule, iterations);
    printResults(noSimdResults);

    console.log('\nRunning SIMD benchmark...');
    const simdResults = await runBenchmark('SIMD Version', simdModule, iterations);
    printResults(simdResults);

    // Print comparison
    printComparison(noSimdResults, simdResults);
}

main().catch(console.error);

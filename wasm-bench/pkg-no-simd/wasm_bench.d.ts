/* tslint:disable */
/* eslint-disable */

/**
 * Run decompression of all test files once and return the total decompressed size in bytes
 */
export function decompress_once(): number;

/**
 * Returns the total size of all compressed test data in bytes
 */
export function get_compressed_size(): number;

/**
 * Returns the number of test files
 */
export function get_file_count(): number;

/**
 * Check if SIMD is enabled (compile-time check).
 * Returns true if compiled with WASM SIMD128 support.
 */
export function is_simd_enabled(): boolean;

/**
 * Run the decompression benchmark for the specified number of iterations.
 * Each iteration decompresses all test files.
 * Returns the total bytes decompressed.
 */
export function run_benchmark(iterations: number): number;

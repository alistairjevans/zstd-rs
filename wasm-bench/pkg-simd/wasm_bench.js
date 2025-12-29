
let imports = {};
imports['__wbindgen_placeholder__'] = module.exports;

/**
 * Run decompression of all test files once and return the total decompressed size in bytes
 * @returns {number}
 */
function decompress_once() {
    const ret = wasm.decompress_once();
    return ret >>> 0;
}
exports.decompress_once = decompress_once;

/**
 * Returns the total size of all compressed test data in bytes
 * @returns {number}
 */
function get_compressed_size() {
    const ret = wasm.get_compressed_size();
    return ret >>> 0;
}
exports.get_compressed_size = get_compressed_size;

/**
 * Returns the number of test files
 * @returns {number}
 */
function get_file_count() {
    const ret = wasm.get_file_count();
    return ret >>> 0;
}
exports.get_file_count = get_file_count;

/**
 * Check if SIMD is enabled (compile-time check).
 * Returns true if compiled with WASM SIMD128 support.
 * @returns {boolean}
 */
function is_simd_enabled() {
    const ret = wasm.is_simd_enabled();
    return ret !== 0;
}
exports.is_simd_enabled = is_simd_enabled;

/**
 * Run the decompression benchmark for the specified number of iterations.
 * Each iteration decompresses all test files.
 * Returns the total bytes decompressed.
 * @param {number} iterations
 * @returns {number}
 */
function run_benchmark(iterations) {
    const ret = wasm.run_benchmark(iterations);
    return ret >>> 0;
}
exports.run_benchmark = run_benchmark;

exports.__wbindgen_init_externref_table = function() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};

const wasmPath = `${__dirname}/wasm_bench_bg.wasm`;
const wasmBytes = require('fs').readFileSync(wasmPath);
const wasmModule = new WebAssembly.Module(wasmBytes);
const wasm = exports.__wasm = new WebAssembly.Instance(wasmModule, imports).exports;

wasm.__wbindgen_start();

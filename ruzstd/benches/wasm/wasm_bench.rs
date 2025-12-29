//! WASM benchmark for measuring decompression performance.
//!
//! This benchmark can be run with or without SIMD to compare performance.
//!
//! Build with SIMD:
//!   RUSTFLAGS="-Ctarget-feature=+simd128" cargo build --target wasm32-unknown-unknown \
//!     --release --features wasm-simd --example wasm_bench
//!
//! Build without SIMD:
//!   cargo build --target wasm32-unknown-unknown --release --example wasm_bench

use wasm_bindgen::prelude::*;

// Include the test file at compile time
const COMPRESSED_DATA: &[u8] = include_bytes!("../../decodecorpus_files/z000033.zst");

/// Returns the size of the compressed test data
#[wasm_bindgen]
pub fn get_compressed_size() -> usize {
    COMPRESSED_DATA.len()
}

/// Run a single decompression and return the decompressed size
#[wasm_bindgen]
pub fn decompress_once() -> usize {
    let mut decoder = ruzstd::decoding::FrameDecoder::new();
    let mut output = vec![0u8; 200 * 1024 * 1024]; // 200MB buffer

    decoder.decode_all(COMPRESSED_DATA, &mut output).unwrap()
}

/// Run the decompression benchmark for the specified number of iterations.
/// Returns the total bytes decompressed.
#[wasm_bindgen]
pub fn run_benchmark(iterations: u32) -> usize {
    let mut decoder = ruzstd::decoding::FrameDecoder::new();
    let mut output = vec![0u8; 200 * 1024 * 1024]; // 200MB buffer
    let mut total_bytes = 0;

    for _ in 0..iterations {
        let bytes = decoder.decode_all(COMPRESSED_DATA, &mut output).unwrap();
        total_bytes += bytes;
    }

    total_bytes
}

/// Check if SIMD is enabled (compile-time check)
#[wasm_bindgen]
pub fn is_simd_enabled() -> bool {
    cfg!(all(target_arch = "wasm32", target_feature = "simd128"))
}

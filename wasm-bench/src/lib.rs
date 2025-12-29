//! WASM benchmark for measuring decompression performance.
//!
//! This benchmark can be run with or without SIMD to compare performance.
//!
//! ## Build Commands
//!
//! Build with SIMD:
//! ```bash
//! RUSTFLAGS="-Ctarget-feature=+simd128" cargo build -p wasm-bench \
//!     --target wasm32-unknown-unknown --release --features simd
//! ```
//!
//! Build without SIMD:
//! ```bash
//! cargo build -p wasm-bench --target wasm32-unknown-unknown --release
//! ```
//!
//! ## Generate JS bindings
//!
//! ```bash
//! wasm-bindgen target/wasm32-unknown-unknown/release/wasm_bench.wasm \
//!     --out-dir wasm-bench/pkg --target nodejs
//! ```

use ruzstd::decoding::FrameDecoder;
use wasm_bindgen::prelude::*;

// Include multiple large test files at compile time for more comprehensive benchmarking
const TEST_FILES: &[&[u8]] = &[
    include_bytes!("../../ruzstd/decodecorpus_files/z000091.zst"), // 459KB - largest
    include_bytes!("../../ruzstd/decodecorpus_files/z000033.zst"), // 427KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000035.zst"), // 403KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000050.zst"), // 320KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000011.zst"), // 255KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000044.zst"), // 240KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000092.zst"), // 240KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000070.zst"), // 225KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000026.zst"), // 205KB
    include_bytes!("../../ruzstd/decodecorpus_files/z000079.zst"), // 203KB
];

/// Returns the total size of all compressed test data in bytes
#[wasm_bindgen]
pub fn get_compressed_size() -> usize {
    TEST_FILES.iter().map(|f| f.len()).sum()
}

/// Returns the number of test files
#[wasm_bindgen]
pub fn get_file_count() -> usize {
    TEST_FILES.len()
}

/// Run decompression of all test files once and return the total decompressed size in bytes
#[wasm_bindgen]
pub fn decompress_once() -> usize {
    let mut decoder = FrameDecoder::new();
    let mut output = vec![0u8; 200 * 1024 * 1024]; // 200MB buffer
    let mut total_bytes = 0;

    for file in TEST_FILES {
        let bytes = decoder.decode_all(file, &mut output).unwrap();
        total_bytes += bytes;
    }

    total_bytes
}

/// Run the decompression benchmark for the specified number of iterations.
/// Each iteration decompresses all test files.
/// Returns the total bytes decompressed.
#[wasm_bindgen]
pub fn run_benchmark(iterations: u32) -> usize {
    let mut decoder = FrameDecoder::new();
    let mut output = vec![0u8; 200 * 1024 * 1024]; // 200MB buffer
    let mut total_bytes = 0;

    for _ in 0..iterations {
        for file in TEST_FILES {
            let bytes = decoder.decode_all(file, &mut output).unwrap();
            total_bytes += bytes;
        }
    }

    total_bytes
}

/// Check if SIMD is enabled (compile-time check).
/// Returns true if compiled with WASM SIMD128 support.
#[wasm_bindgen]
pub fn is_simd_enabled() -> bool {
    cfg!(all(target_arch = "wasm32", target_feature = "simd128"))
}

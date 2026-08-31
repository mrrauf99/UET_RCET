import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["text2wav", "@breezystack/lamejs", "kokoro-js", "@huggingface/transformers"],
  outputFileTracingIncludes: {
    "/api/a11y/audio": [
      "./src/lib/a11y/audio-worker.mjs", "./src/lib/a11y/audio-text.mjs", "./.cache/a11y-audio/kokoro/**/*",
      "./node_modules/text2wav/**/*", "./node_modules/@breezystack/lamejs/package.json", "./node_modules/@breezystack/lamejs/dist/lamejs.js",
      "./node_modules/kokoro-js/package.json", "./node_modules/kokoro-js/dist/kokoro.js",
      "./node_modules/kokoro-js/voices/bf_emma.bin", "./node_modules/kokoro-js/voices/bm_george.bin",
      "./node_modules/@huggingface/transformers/package.json", "./node_modules/@huggingface/transformers/dist/transformers.node.mjs",
      "./node_modules/phonemizer/package.json", "./node_modules/phonemizer/dist/phonemizer.js",
      "./node_modules/onnxruntime-node/package.json", "./node_modules/onnxruntime-node/dist/**/*",
      `./node_modules/onnxruntime-node/bin/napi-v6/${process.platform}/${process.arch}/**/*`,
      "./node_modules/onnxruntime-common/**/*", "./node_modules/onnxruntime-node/node_modules/onnxruntime-common/**/*",
    ],
  },
  images: {
    qualities: [75, 90],
  },
  // A lockfile in a parent folder would otherwise be picked as the workspace root.
  turbopack: {
    root: __dirname,
  },
  // Keep links and search rankings from the previous rcet.uet.edu.pk site working.
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/vision-and-mission", destination: "/about#vision", permanent: true },
      { source: "/campus/:path*", destination: "/facilities", permanent: true },
      { source: "/contact", destination: "/#visit", permanent: true },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// NOTE: this checkout lives on an exFAT volume (D:), where Node's `fs.readlink`
// on a regular file returns EISDIR instead of EINVAL. Next calls readlink during
// the build and treats EISDIR as fatal. That is repaired by
// `scripts/readlink-shim.cjs`, which `npm run build` preloads; it is a no-op on
// NTFS/ext4. Nothing here needs to work around the filesystem.
const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;

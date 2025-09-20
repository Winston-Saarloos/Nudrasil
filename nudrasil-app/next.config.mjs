/** @type {import('next').NextConfig} */
import bundleAnalayzer from "@next/bundle-analyzer";

const nextConfig = {
  output: "standalone",
};

const withBundleAnalyzer = bundleAnalayzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

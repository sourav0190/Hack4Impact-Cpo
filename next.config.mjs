/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["snarkjs", "circomlib", "algosdk", "@mediapipe/tasks-vision"],
};

export default nextConfig;

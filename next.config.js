/** @type {import('next').NextConfig} */
const isGH = process.env.GITHUB_PAGES === 'true' // opcional

const repo = 'FlowGuilt-frontend' // <--- troque

const basePath = isGH ? `/${repo}` : ''

module.exports = {
  eslint: { ignoreDuringBuilds: true },
  output: 'export',            // gera HTML estático (out/)
  images: { unoptimized: true }, // GH Pages não suporta Image Optimization
  trailingSlash: true,         // ajuda com 404/refresh
  basePath,
  assetPrefix: isGH ? `${basePath}/` : undefined,    // assets com prefixo /REPO/
}

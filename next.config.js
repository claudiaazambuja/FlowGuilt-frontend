/** @type {import('next').NextConfig} */
const isGH = process.env.GITHUB_PAGES === 'true' // opcional

const repo = 'FlowGuilt-frontend' // <--- troque

module.exports = {
  output: 'export',            // gera HTML estático (out/)
  images: { unoptimized: true }, // GH Pages não suporta Image Optimization
  trailingSlash: true,         // ajuda com 404/refresh
  basePath: `/${repo}`,        // caminhos sob /REPO
  assetPrefix: `/${repo}/`,    // assets com prefixo /REPO/
}

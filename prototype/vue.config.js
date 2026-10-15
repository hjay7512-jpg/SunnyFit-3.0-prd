module.exports = {
  publicPath: process.env.DEMO_PUBLIC_PATH || '/',
  productionSourceMap: false,
  devServer: {
    open: false,
    proxy: { '/api': { target: 'http://127.0.0.1:3011', changeOrigin: false } }
  },
  chainWebpack(config) { config.plugins.delete('prefetch') }
}

const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        express: false,
        "body-parser": false,
        cors: false,
        http: false,
        https: false,
        fs: false,
        path: false,
        stream: false,
        util: false,
        zlib: false,
        crypto: false,
        querystring: false,
        buffer: false,
        net: false,
        url: false,
      };

      webpackConfig.module.rules.push({
        test: /node_modules[\\/](express|body-parser|cors)[\\/]/,
        use: 'null-loader',
      });

      return webpackConfig;
    },
  },
};
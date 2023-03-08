const path = require('path');
const withNextra = require('nextra')({
    theme: 'nextra-theme-docs',
    themeConfig: './theme.config.tsx',
    defaultShowCopyCode: true,
});

module.exports = withNextra({
    basePath: '/docs',
    reactStrictMode: true,
    transpilePackages: ['ui'],
    output: 'standalone',
    experimental: {
        outputFileTracingRoot: path.join(__dirname, '../../'),
    },
    i18n: {
        locales: ['en-US', 'zh-CN'],
        defaultLocale: 'en-US',
    },
    swcMinify: true,
    compiler: {
        styledComponents: true,
        reactRemoveProperties: true,
        removeConsole:
            process.env.NODE_ENV == 'development'
                ? false
                : {
                      exclude: ['error'],
                  },
    },
    redirects: () => {
        return [
            {
                source: '/docs',
                destination: '/docs/cloud/Getting-Started',
                statusCode: 301,
            },
        ];
    },
});

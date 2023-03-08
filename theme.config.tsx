/* eslint-disable @next/next/no-css-tags */
/* eslint-disable react-hooks/rules-of-hooks */
import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
const config: DocsThemeConfig = {
  // head: (
  //     <>
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //         <meta property="og:title" content="SelectDB" />
  //         <meta property="og:description" content="SelectDB Website" />
  //         {/* <script src="https://cdn.tailwindcss.com"></script> */}
  //     </>
  // ),
  logo: <span>SelectDB</span>,
  project: {
    link: "https://github.com/shuding/nextra-docs-template",
  },
  banner: {
    key: "2.0-release",
    text: (
      <a href="https://cn.selectdb.com" rel="noreferrer" target="_blank">
        🎉 SelectDB Cloud 2.0 is released. Read more →
      </a>
    ),
  },
  // navbar: {
  //     component: <Navbar isDocsApp />,
  // },
  chat: {
    link: "https://discord.com",
  },
  docsRepositoryBase: "https://github.com/shuding/nextra-docs-template",
  footer: {
    text: () => {
      const { locale } = useRouter();
      switch (locale) {
        case "zh-CN":
          return (
            <a
              href="https://vercel.com/?utm_source=swr_zh-cn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center no-underline text-current font-semibold"
            >
              <span className="mr-2">由</span>
              驱动
            </a>
          );
        default:
          return (
            <a
              href="https://vercel.com/?utm_source=swr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center no-underline text-current font-semibold"
            >
              <span className="mr-1">Powered by</span>
              <span>Logo</span>
            </a>
          );
      }
    },
  },
  i18n: [
    { locale: "en-US", text: "English" },
    { locale: "zh-CN", text: "简体中文" },
  ],
};

export default config;

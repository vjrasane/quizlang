import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  framework: "@storybook/react-vite",
  viteFinal: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(import.meta.dirname, ".."),
    };
    config.plugins = [...(config.plugins || []), tailwindcss()];
    return config;
  },
};
export default config;

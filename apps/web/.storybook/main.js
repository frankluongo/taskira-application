/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ["../src/base/**/*.stories.@(js|jsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;

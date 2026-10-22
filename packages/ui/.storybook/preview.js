// Design tokens and @layer ordering live in apps/web, not this package -
// imported cross-package here so components render with real styles.
import "../../../apps/web/src/index.css";

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

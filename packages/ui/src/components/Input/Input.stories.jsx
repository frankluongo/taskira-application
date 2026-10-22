import { Input } from "./Input";

export default {
  title: "Components/Input",
  component: Input,
  args: {
    id: "example-input",
    label: "Label",
    placeholder: "Type something…",
  },
};

export const Default = {};

export const HiddenLabel = {
  args: { showLabel: false },
};

import { Button } from "./Button";

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "icon", "pill"],
    },
  },
  args: {
    variant: "primary",
    children: "Button",
  },
};

export const Primary = {
  args: { variant: "primary" },
};

export const Secondary = {
  args: { variant: "secondary" },
};

export const Pill = {
  args: { variant: "pill" },
};

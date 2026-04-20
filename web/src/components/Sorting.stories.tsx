import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Sorting } from "./Sorting";

const meta: Meta<typeof Sorting> = {
  component: Sorting,
  args: {
    onAnswer: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Sorting>;

export const Default: Story = {
  args: {
    items: [
      { key: 0, text: "Mercury", notes: "Closest to the Sun" },
      { key: 1, text: "Venus", notes: null },
      { key: 2, text: "Earth", notes: null },
      { key: 3, text: "Mars", notes: "The Red Planet" },
    ],
    seed: 42,
  },
};

export const ManyItems: Story = {
  args: {
    items: [
      { key: 0, text: "1969 — Moon landing", notes: null },
      { key: 1, text: "1971 — First email sent", notes: null },
      { key: 2, text: "1989 — World Wide Web invented", notes: null },
      { key: 3, text: "1991 — Linux released", notes: null },
      { key: 4, text: "1998 — Google founded", notes: null },
      { key: 5, text: "2007 — iPhone launched", notes: null },
    ],
    seed: 7,
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { key: 0, text: "World War I", notes: "1914–1918" },
      { key: 1, text: "World War II", notes: "1939–1945" },
    ],
    seed: 1,
  },
};

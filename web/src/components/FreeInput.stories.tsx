import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { FreeInput } from "./FreeInput";

const meta: Meta<typeof FreeInput> = {
  component: FreeInput,
  args: {
    onAnswer: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof FreeInput>;

export const Default: Story = {
  args: {
    answer: {
      text: "2006",
      correct: true,
      label: null,
      notes: "Pluto was reclassified as a dwarf planet by the IAU in 2006",
    },
  },
};

export const WithoutNotes: Story = {
  args: {
    answer: {
      text: "Helsinki",
      correct: true,
      label: null,
      notes: null,
    },
  },
};

export const LongAnswer: Story = {
  args: {
    answer: {
      text: "The mitochondria is the powerhouse of the cell",
      correct: true,
      label: null,
      notes: "This is one of the most commonly cited biology facts",
    },
  },
};

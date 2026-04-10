import type { Meta, StoryObj } from "@storybook/react-vite";
import { FreeInput } from "./FreeInput";

const meta: Meta<typeof FreeInput> = {
  component: FreeInput,
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
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

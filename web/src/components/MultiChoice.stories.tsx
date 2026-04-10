import type { Meta, StoryObj } from "@storybook/react-vite";
import { MultiChoice } from "./MultiChoice";

const meta: Meta<typeof MultiChoice> = {
  component: MultiChoice,
};
export default meta;

type Story = StoryObj<typeof MultiChoice>;

export const Default: Story = {
  args: {
    answers: [
      { text: "Mercury", correct: true, label: null, notes: null },
      { text: "Venus", correct: true, label: null, notes: null },
      { text: "Earth", correct: true, label: null, notes: null },
      { text: "Mars", correct: true, label: null, notes: null },
      { text: "Jupiter", correct: false, label: null, notes: null },
      { text: "Saturn", correct: false, label: null, notes: null },
    ],
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

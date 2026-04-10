import type { Meta, StoryObj } from "@storybook/react-vite";
import { SingleChoice } from "./SingleChoice";

const meta: Meta<typeof SingleChoice> = {
  component: SingleChoice,
};
export default meta;

type Story = StoryObj<typeof SingleChoice>;

export const Default: Story = {
  args: {
    answers: [
      { text: "Jupiter", correct: true, label: null, notes: null },
      { text: "Saturn", correct: false, label: null, notes: null },
      { text: "Neptune", correct: false, label: null, notes: null },
      { text: "Uranus", correct: false, label: null, notes: null },
    ],
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

export const WithNotes: Story = {
  args: {
    answers: [
      {
        text: "Venus",
        correct: true,
        label: null,
        notes: "Venus rotates in the opposite direction to most planets",
      },
      { text: "Mars", correct: false, label: null, notes: null },
      { text: "Mercury", correct: false, label: null, notes: null },
      { text: "Neptune", correct: false, label: null, notes: null },
    ],
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SingleChoice } from "./SingleChoice";

const meta: Meta<typeof SingleChoice> = {
  component: SingleChoice,
  args: {
    onAnswer: fn(),
  },
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
      {
        text: "Mars",
        correct: false,
        label: null,
        notes: "Mars rotates in the same direction as Earth",
      },
      { text: "Mercury", correct: false, label: null, notes: null },
      { text: "Neptune", correct: false, label: null, notes: null },
    ],
  },
};

export const TwoOptions: Story = {
  args: {
    answers: [
      { text: "True", correct: true, label: null, notes: null },
      { text: "False", correct: false, label: null, notes: null },
    ],
  },
};

export const ManyOptions: Story = {
  args: {
    answers: [
      { text: "Helsinki", correct: true, label: null, notes: null },
      { text: "Stockholm", correct: false, label: null, notes: null },
      { text: "Oslo", correct: false, label: null, notes: null },
      { text: "Copenhagen", correct: false, label: null, notes: null },
      { text: "Reykjavik", correct: false, label: null, notes: null },
      { text: "Tallinn", correct: false, label: null, notes: null },
    ],
  },
};

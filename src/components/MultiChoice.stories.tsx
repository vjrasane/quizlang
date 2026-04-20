import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MultiChoice } from "./MultiChoice";

const meta: Meta<typeof MultiChoice> = {
  component: MultiChoice,
  args: {
    onAnswer: fn(),
  },
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
  },
};

export const WithNotes: Story = {
  args: {
    answers: [
      {
        text: "Python",
        correct: true,
        label: null,
        notes: "Dynamically typed, interpreted",
      },
      {
        text: "JavaScript",
        correct: true,
        label: null,
        notes: "Dynamically typed, JIT compiled",
      },
      {
        text: "Rust",
        correct: false,
        label: null,
        notes: "Statically typed, compiled",
      },
      {
        text: "Go",
        correct: false,
        label: null,
        notes: "Statically typed, compiled",
      },
    ],
  },
};

export const TwoOptions: Story = {
  args: {
    answers: [
      { text: "Water", correct: true, label: null, notes: null },
      { text: "Oil", correct: false, label: null, notes: null },
    ],
  },
};

export const SingleCorrect: Story = {
  args: {
    answers: [
      { text: "Nitrogen", correct: true, label: null, notes: null },
      { text: "Oxygen", correct: false, label: null, notes: null },
      { text: "Carbon dioxide", correct: false, label: null, notes: null },
      { text: "Hydrogen", correct: false, label: null, notes: null },
    ],
  },
};

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Categorize } from "./Categorize";

const meta: Meta<typeof Categorize> = {
  component: Categorize,
};
export default meta;

type Story = StoryObj<typeof Categorize>;

export const Default: Story = {
  args: {
    categories: [
      {
        text: "Planets",
        answers: [
          { text: "Jupiter", correct: false, label: null, notes: "The largest planet in our solar system" },
          { text: "Saturn", correct: false, label: null, notes: "Known for its prominent ring system" },
          { text: "Earth", correct: false, label: null, notes: null },
        ],
      },
      {
        text: "Dwarf Planets",
        answers: [
          { text: "Pluto", correct: false, label: null, notes: "Reclassified in 2006" },
          { text: "Eris", correct: false, label: null, notes: null },
          { text: "Ceres", correct: false, label: null, notes: "Located in the asteroid belt" },
        ],
      },
      {
        text: "Moons",
        answers: [
          { text: "Titan", correct: false, label: null, notes: "Saturn's largest moon" },
          { text: "Europa", correct: false, label: null, notes: "May harbor a subsurface ocean" },
        ],
      },
    ],
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

export const TwoCategories: Story = {
  args: {
    categories: [
      {
        text: "Mammals",
        answers: [
          { text: "Dog", correct: false, label: null, notes: null },
          { text: "Cat", correct: false, label: null, notes: null },
          { text: "Whale", correct: false, label: null, notes: null },
        ],
      },
      {
        text: "Reptiles",
        answers: [
          { text: "Snake", correct: false, label: null, notes: null },
          { text: "Lizard", correct: false, label: null, notes: null },
          { text: "Crocodile", correct: false, label: null, notes: null },
        ],
      },
    ],
    onAnswer: (correct) => console.log("answered:", correct),
  },
};

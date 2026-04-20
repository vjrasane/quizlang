import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Categorize } from "./Categorize";

const meta: Meta<typeof Categorize> = {
  component: Categorize,
  args: {
    onAnswer: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Categorize>;

export const Default: Story = {
  args: {
    categories: [
      {
        text: "Planets",
        answers: [
          {
            text: "Jupiter",
            correct: false,
            label: null,
            notes: "The largest planet in our solar system",
          },
          {
            text: "Saturn",
            correct: false,
            label: null,
            notes: "Known for its prominent ring system",
          },
          { text: "Earth", correct: false, label: null, notes: null },
        ],
      },
      {
        text: "Dwarf Planets",
        answers: [
          {
            text: "Pluto",
            correct: false,
            label: null,
            notes: "Reclassified in 2006",
          },
          { text: "Eris", correct: false, label: null, notes: null },
          {
            text: "Ceres",
            correct: false,
            label: null,
            notes: "Located in the asteroid belt",
          },
        ],
      },
      {
        text: "Moons",
        answers: [
          {
            text: "Titan",
            correct: false,
            label: null,
            notes: "Saturn's largest moon",
          },
          {
            text: "Europa",
            correct: false,
            label: null,
            notes: "May harbor a subsurface ocean",
          },
        ],
      },
    ],
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
  },
};

export const ManyItems: Story = {
  args: {
    categories: [
      {
        text: "Frontend",
        answers: [
          { text: "React", correct: false, label: null, notes: null },
          { text: "Vue", correct: false, label: null, notes: null },
          { text: "Svelte", correct: false, label: null, notes: null },
          { text: "Angular", correct: false, label: null, notes: null },
        ],
      },
      {
        text: "Backend",
        answers: [
          { text: "Express", correct: false, label: null, notes: null },
          { text: "Django", correct: false, label: null, notes: null },
          { text: "Rails", correct: false, label: null, notes: null },
          { text: "Spring", correct: false, label: null, notes: null },
        ],
      },
      {
        text: "Database",
        answers: [
          { text: "PostgreSQL", correct: false, label: null, notes: null },
          { text: "MongoDB", correct: false, label: null, notes: null },
          { text: "Redis", correct: false, label: null, notes: null },
          { text: "SQLite", correct: false, label: null, notes: null },
        ],
      },
    ],
  },
};

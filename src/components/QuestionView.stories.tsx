import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { QuestionView } from "./QuestionView";

const meta: Meta<typeof QuestionView> = {
  component: QuestionView,
  args: {
    onAnswer: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl bg-bg-1 border border-border rounded-lg p-4 sm:p-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof QuestionView>;

export const SingleChoice: Story = {
  args: {
    item: {
      body: "# What is the largest planet in our solar system?\n\nSelect one answer.",
      question: {
        type: "SingleChoice",
        answers: [
          { text: "Jupiter", correct: true, label: null, notes: null },
          { text: "Saturn", correct: false, label: null, notes: null },
          { text: "Neptune", correct: false, label: null, notes: null },
          { text: "Uranus", correct: false, label: null, notes: null },
        ],
      },
    },
  },
};

export const MultiChoice: Story = {
  args: {
    item: {
      body: "# Which of these are rocky planets?\n\nSelect all that apply.",
      question: {
        type: "MultiChoice",
        answers: [
          { text: "Mercury", correct: true, label: null, notes: null },
          { text: "Venus", correct: true, label: null, notes: null },
          { text: "Earth", correct: true, label: null, notes: null },
          { text: "Mars", correct: true, label: null, notes: null },
          { text: "Jupiter", correct: false, label: null, notes: null },
          { text: "Saturn", correct: false, label: null, notes: null },
        ],
      },
    },
  },
};

export const FreeInput: Story = {
  args: {
    item: {
      body: "# In what year was Pluto reclassified as a dwarf planet?",
      question: {
        type: "FreeInput",
        answer: {
          text: "2006",
          correct: true,
          label: null,
          notes: "The IAU redefined the criteria for planet classification",
        },
      },
    },
  },
};

export const Categorize: Story = {
  args: {
    item: {
      body: "# Classify the following celestial bodies\n\nDrag each item into the correct category.",
      question: {
        type: "Categorize",
        categories: [
          {
            text: "Planets",
            answers: [
              { text: "Jupiter", correct: false, label: null, notes: null },
              { text: "Saturn", correct: false, label: null, notes: null },
            ],
          },
          {
            text: "Dwarf Planets",
            answers: [
              { text: "Pluto", correct: false, label: null, notes: null },
              { text: "Ceres", correct: false, label: null, notes: null },
            ],
          },
        ],
      },
    },
  },
};

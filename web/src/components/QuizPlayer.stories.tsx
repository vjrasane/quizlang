import type { Meta, StoryObj } from "@storybook/react-vite";
import { QuizPlayer } from "./QuizPlayer";
import type { Quiz } from "@/src/types/quiz";

const sampleQuiz: Quiz = {
  frontmatter: { name: "Sample Quiz", language: "en" },
  items: [
    {
      header: "What is the largest planet in our solar system?",
      text: null,
      items: [],
      question: {
        type: "SingleChoice",
        answers: [
          { text: "Jupiter", correct: true, label: null, notes: "Jupiter has a mass of 1.898 × 10²⁷ kg" },
          { text: "Saturn", correct: false, label: null, notes: null },
          { text: "Neptune", correct: false, label: null, notes: null },
        ],
      },
    },
    {
      header: "Which of these are rocky planets?",
      text: "Select all that apply.",
      items: [],
      question: {
        type: "MultiChoice",
        answers: [
          { text: "Mercury", correct: true, label: null, notes: null },
          { text: "Venus", correct: true, label: null, notes: null },
          { text: "Earth", correct: true, label: null, notes: null },
          { text: "Jupiter", correct: false, label: null, notes: null },
        ],
      },
    },
    {
      header: "In what year was Pluto reclassified as a dwarf planet?",
      text: null,
      items: [],
      question: {
        type: "FreeInput",
        answer: { text: "2006", correct: true, label: null, notes: "The IAU redefined planet classification criteria" },
      },
    },
    {
      header: "Classify these celestial bodies",
      text: "Drag each item into the correct category.",
      items: [],
      question: {
        type: "Categorize",
        categories: [
          {
            text: "Planets",
            answers: [
              { text: "Earth", correct: false, label: null, notes: null },
              { text: "Mars", correct: false, label: null, notes: null },
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
  ],
};

const meta: Meta<typeof QuizPlayer> = {
  component: QuizPlayer,
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof QuizPlayer>;

export const Default: Story = {
  args: {
    quizId: "sample",
    initialQuiz: sampleQuiz,
  },
};

export const ShuffledAnswers: Story = {
  args: {
    quizId: "sample",
    initialQuiz: sampleQuiz,
  },
};

const noShuffleQuiz: Quiz = {
  ...sampleQuiz,
  frontmatter: { ...sampleQuiz.frontmatter as object, shuffle_answers: false },
};

export const NoShuffle: Story = {
  args: {
    quizId: "sample",
    initialQuiz: noShuffleQuiz,
  },
};

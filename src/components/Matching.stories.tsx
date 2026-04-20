import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Matching } from "./Matching";

const meta: Meta<typeof Matching> = {
  component: Matching,
  args: {
    onAnswer: fn(),
  },
};
export default meta;

type Story = StoryObj<typeof Matching>;

export const Default: Story = {
  args: {
    pairs: [
      { left: "France", right: "Paris", notes: "City of Light" },
      { left: "Japan", right: "Tokyo", notes: null },
      { left: "Germany", right: "Berlin", notes: null },
      { left: "Italy", right: "Rome", notes: "The Eternal City" },
    ],
    seed: 42,
  },
};

export const ManyPairs: Story = {
  args: {
    pairs: [
      { left: "H₂O", right: "Water", notes: null },
      { left: "NaCl", right: "Salt", notes: null },
      { left: "CO₂", right: "Carbon dioxide", notes: null },
      { left: "O₂", right: "Oxygen", notes: null },
      { left: "Fe", right: "Iron", notes: null },
      { left: "Au", right: "Gold", notes: null },
    ],
    seed: 7,
  },
};

export const TwoPairs: Story = {
  args: {
    pairs: [
      { left: "Sun", right: "Star", notes: null },
      { left: "Earth", right: "Planet", notes: null },
    ],
    seed: 1,
  },
};

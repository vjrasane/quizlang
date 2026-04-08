use crate::ast::*;
use std::io::{self, Write};

pub struct GameState {
    pub correct: usize,
    pub total: usize,
}

impl GameState {
    pub fn new() -> Self {
        GameState {
            correct: 0,
            total: 0,
        }
    }

    pub fn run(&mut self, quiz: &Quiz) {
        self.run_items(&quiz.items);
        println!(
            "Quiz completed! You got {}/{} correct.",
            self.correct, self.total
        );
    }

    fn run_items(&mut self, question: &Question) {
        match question {
            Question::FreeInput { text, answer } => self.ask_free_input(text, anser),
        }
    }
}

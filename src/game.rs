use crate::ast::*;
use inquire::{InquireError, MultiSelect, Select, Text};
use std::collections::HashSet;

use rand::seq::SliceRandom;

pub struct GameState {
    pub correct: usize,
    pub total: usize,
}

#[derive(Debug)]
enum GameError {
    Inquire(InquireError),
    InvalidState(String),
}

struct AnswerOption<'a> {
    index: usize,
    answer: &'a Answer,
}

impl std::fmt::Display for AnswerOption<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match &self.answer.label {
            Some(label) => write!(f, "({}) {}", label, self.answer.text),
            None => write!(f, "({}) {}", self.index + 1, self.answer.text),
        }
    }
}

enum QuestionResult {
    Correct,
    Incorrect(CorrectAnswer),
}

enum CorrectAnswer {
    One(Answer),
    Any(Vec<Answer>),
    All(Vec<Answer>),
    Category(Category),
    SortOrder(Vec<SortItem>),
    Match(MatchPair),
}

impl GameState {
    pub fn new() -> Self {
        GameState {
            correct: 0,
            total: 0,
        }
    }

    pub fn run(&mut self, quiz: &Quiz) -> Result<(), InquireError> {
        self.run_items(&quiz.items)?;
        println!(
            "Quiz completed! You got {}/{} correct.",
            self.correct, self.total
        );
        Ok(())
    }

    fn run_items(&mut self, items: &[Section]) -> Result<(), InquireError> {
        for item in items {
            let text = match &item.text {
                Some(t) => format!("\n# {}\n{}\n", item.header, t),
                None => format!("\n# {}\n", item.header),
            };
            if let Some(question) = &item.question {
                self.ask_question(&text, question)?;
            } else {
                println!("{}", text);
            }
        }
        Ok(())
    }

    fn ask_question(&mut self, text: &str, question: &Question) -> Result<(), InquireError> {
        self.total += 1;
        let result = match question {
            Question::FreeInput { answer } => self.ask_free_input(text, answer)?,
            Question::SingleChoice { answers } => self.ask_single_choice(text, answers)?,
            Question::MultiChoice { answers } => self.ask_multi_choice(text, answers)?,
            Question::Categorize { categories } => self.ask_categorize(text, categories)?,
            Question::Sorting { items } => self.ask_sorting(text, items)?,
            Question::Matching { pairs } => self.ask_matching(text, pairs)?,
        };

        match result {
            QuestionResult::Correct => {
                println!("Correct!\n");
                self.correct += 1;
            }
            QuestionResult::Incorrect(CorrectAnswer::One(ans)) => {
                println!("Incorrect. The correct answer was: {}\n", ans.text);
            }
            QuestionResult::Incorrect(CorrectAnswer::Any(ans)) => {
                let correct_texts: Vec<String> = ans.iter().map(|a| a.text.clone()).collect();
                println!(
                    "Incorrect. The correct answer was: {}\n",
                    correct_texts.join(", ")
                );
            }
            QuestionResult::Incorrect(CorrectAnswer::All(ans)) => {
                let correct_texts: Vec<String> = ans.iter().map(|a| a.text.clone()).collect();
                println!(
                    "Incorrect. The correct answers were: {}\n",
                    correct_texts.join(", ")
                );
            }
            QuestionResult::Incorrect(CorrectAnswer::Category(cat)) => {
                println!(
                    "Incorrect. The correct category for the answers was: {}\n",
                    cat.text
                );
            }
            QuestionResult::Incorrect(CorrectAnswer::SortOrder(items)) => {
                let correct_order: Vec<&str> = items.iter().map(|i| i.text.as_str()).collect();
                println!(
                    "Incorrect. The correct order was:\n{}\n",
                    correct_order
                        .iter()
                        .enumerate()
                        .map(|(i, t)| format!("  {}. {}", i + 1, t))
                        .collect::<Vec<_>>()
                        .join("\n")
                );
            }
            QuestionResult::Incorrect(CorrectAnswer::Match(pair)) => {
                println!(
                    "Incorrect. The correct match was: {} → {}\n",
                    pair.left, pair.right
                );
            }
        }

        Ok(())
    }

    fn ask_free_input(
        &mut self,
        text: &str,
        answer: &Answer,
    ) -> Result<QuestionResult, InquireError> {
        let input = Text::new(text).prompt()?;
        let answer_text = answer.text.trim();
        if input.trim().eq_ignore_ascii_case(answer_text) {
            Ok(QuestionResult::Correct)
        } else {
            Ok(QuestionResult::Incorrect(CorrectAnswer::One(
                answer.clone(),
            )))
        }
    }

    fn ask_single_choice(
        &mut self,
        question_text: &str,
        answers: &[Answer],
    ) -> Result<QuestionResult, InquireError> {
        let options = answers
            .iter()
            .enumerate()
            .map(|(i, a)| AnswerOption {
                index: i,
                answer: a,
            })
            .collect();
        let selected = Select::new(question_text, options).prompt()?;
        let correct: Vec<&Answer> = answers.iter().filter(|a| a.correct).collect();
        if selected.answer.correct {
            Ok(QuestionResult::Correct)
        } else {
            Ok(QuestionResult::Incorrect(CorrectAnswer::Any(
                correct.into_iter().cloned().collect(),
            )))
        }
    }

    fn ask_multi_choice(
        &mut self,
        question_text: &str,
        answers: &[Answer],
    ) -> Result<QuestionResult, InquireError> {
        let options = answers
            .iter()
            .enumerate()
            .map(|(i, a)| AnswerOption {
                index: i,
                answer: a,
            })
            .collect();
        let selected = MultiSelect::new(question_text, options).prompt()?;
        let correct: Vec<(usize, &Answer)> = answers
            .iter()
            .enumerate()
            .filter(|(_, a)| a.correct)
            .collect();

        let selected_indices: HashSet<usize> = selected.iter().map(|o| o.index).collect();
        let correct_indices: HashSet<usize> = correct.iter().map(|(i, _)| *i).collect();
        let correct_answers: Vec<&Answer> = correct.iter().map(|(_, t)| *t).collect();

        if selected_indices == correct_indices {
            Ok(QuestionResult::Correct)
        } else {
            Ok(QuestionResult::Incorrect(CorrectAnswer::All(
                correct_answers.into_iter().cloned().collect(),
            )))
        }
    }

    fn ask_categorize(
        &self,
        question_text: &str,
        categories: &[Category],
    ) -> Result<QuestionResult, InquireError> {
        println!("{}", question_text);

        let category_names: Vec<&str> = categories.iter().map(|c| c.text.as_str()).collect();
        let mut answers: Vec<&Answer> = categories.iter().flat_map(|c| c.answers.iter()).collect();
        answers.shuffle(&mut rand::rng());

        for answer in answers {
            let category = categories
                .iter()
                .find(|c| c.answers.iter().any(|a| a.text == answer.text))
                .expect("category not found");

            let selected = Select::new(
                &format!("'{}' belongs to:", answer.text),
                category_names.clone(),
            )
            .prompt()?;

            if selected != category.text {
                return Ok(QuestionResult::Incorrect(CorrectAnswer::Category(
                    category.clone(),
                )));
            }
        }

        Ok(QuestionResult::Correct)
    }

    fn ask_sorting(
        &self,
        question_text: &str,
        items: &[SortItem],
    ) -> Result<QuestionResult, InquireError> {
        println!("{}", question_text);

        let mut sorted = items.to_vec();
        sorted.sort_by_key(|i| i.key);

        let mut shuffled = items.to_vec();
        shuffled.shuffle(&mut rand::rng());

        let labels: Vec<String> = shuffled.iter().map(|i| i.text.clone()).collect();

        let mut user_order: Vec<String> = Vec::new();
        for position in 1..=labels.len() {
            let remaining: Vec<String> = labels
                .iter()
                .filter(|l| !user_order.contains(l))
                .cloned()
                .collect();
            let selected = Select::new(&format!("Position {}:", position), remaining).prompt()?;
            user_order.push(selected);
        }

        let correct_order: Vec<&str> = sorted.iter().map(|i| i.text.as_str()).collect();
        if user_order.iter().map(|s| s.as_str()).collect::<Vec<_>>() == correct_order {
            Ok(QuestionResult::Correct)
        } else {
            Ok(QuestionResult::Incorrect(CorrectAnswer::SortOrder(sorted)))
        }
    }

    fn ask_matching(
        &self,
        question_text: &str,
        pairs: &[MatchPair],
    ) -> Result<QuestionResult, InquireError> {
        println!("{}", question_text);

        let mut rights: Vec<&str> = pairs.iter().map(|p| p.right.as_str()).collect();
        rights.shuffle(&mut rand::rng());

        for pair in pairs {
            let options = rights.clone();
            let selected = Select::new(
                &format!("'{}' matches with:", pair.left),
                options,
            )
            .prompt()?;

            if selected != pair.right {
                return Ok(QuestionResult::Incorrect(CorrectAnswer::Match(
                    pair.clone(),
                )));
            }
        }

        Ok(QuestionResult::Correct)
    }
}

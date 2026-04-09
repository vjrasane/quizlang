use clap::{Parser, Subcommand};
use inquire::InquireError;
use std::fs;

mod ast;
mod game;
mod lexer;
mod parser;
mod token;

use crate::ast::*;
use crate::game::GameState;
use thiserror::Error;

#[derive(Debug, Error)]
#[error("{0}")]
enum CliError {
    Parse(#[from] parser::ParseError),
    Inquire(#[from] InquireError),
    Lex(#[from] lexer::LexError),
    Io(#[from] std::io::Error),
}

#[derive(Parser)]
#[command(name = "quiz")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Parse and output as JSON
    Parse {
        /// Path to the quiz file
        file: String,
    },
    /// Play the quiz interactively
    Play {
        /// Path to the quiz file
        file: String,
    },
}

impl Cli {
    fn run(&self) -> Result<(), CliError> {
        match &self.command {
            Command::Parse { file } => self.cmd_parse(file)?,
            Command::Play { file } => self.cmd_play(file)?,
        }
        Ok(())
    }

    fn cmd_play(&self, file: &str) -> Result<(), CliError> {
        let quiz = self.parse_quiz(file)?;
        GameState::new().run(&quiz)?;
        Ok(())
    }

    fn cmd_parse(&self, file: &str) -> Result<(), CliError> {
        let quiz = self.parse_quiz(file)?;
        println!("{}", serde_json::to_string_pretty(&quiz).unwrap());
        Ok(())
    }

    fn parse_quiz(&self, file: &str) -> Result<Quiz, CliError> {
        let input = fs::read_to_string(file)?;
        let tokens = lexer::lex(&input)?;
        let quiz = parser::parse(tokens)?;
        Ok(quiz)
    }
}

fn main() {
    let cli = Cli::parse();

    if let Err(error) = cli.run() {
        eprintln!("Error: {}", error);
        std::process::exit(1);
    }
}

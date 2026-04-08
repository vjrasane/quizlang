use clap::Parser;
use std::env;
use std::fs;

mod ast;
mod lexer;
mod parser;
mod token;

use crate::ast::*;

#[derive(Parser)]
#[command(name = "quiz")]
struct Cli {
    /// Path to the quiz file
    file: String,

    /// Output as JSON
    #[arg(long)]
    json: bool,
}

impl Cli {
    fn output(&self, quiz: &Quiz) {
        if self.json {
            println!("{}", serde_json::to_string_pretty(quiz).unwrap());
        } else {
            println!("{:#?}", quiz);
        }
    }

    fn parse_quiz(&self) {
        let input = fs::read_to_string(&self.file).expect("failed to read file");
        let tokens = lexer::lex(&input);

        match parser::parse(tokens) {
            Ok(quiz) => self.output(&quiz),
            Err(err) => eprintln!("parse error at line {}: {}", err.line, err.message),
        }
    }
}

fn main() {
    let cli = Cli::parse();

    cli.parse_quiz();
}

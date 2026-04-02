use std::env;
use std::fs;

mod ast;
mod lexer;
mod parser;
mod token;

fn main() {
    let path = env::args()
        .nth(1)
        .unwrap_or("examples/sample.quiz".to_string());
    let input = fs::read_to_string(&path).expect("failed to read file");
    let tokens = lexer::lex(&input);

    match parser::parse(tokens) {
        Ok(quiz) => println!("{:#?}", quiz),
        Err(err) => eprintln!("parse error at line {}: {}", err.line, err.message),
    }
}

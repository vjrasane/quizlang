use crate::ast::*;
use crate::token::{Token, TokenKind};

use thiserror::Error;
struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

#[derive(Debug, Error)]
pub enum ParseError {
    #[error("line {line}: unexpected token: expected {expected}, got {got:?}")]
    UnexpectedToken {
        line: usize,
        expected: String,
        got: TokenKind,
    },
    #[error("line {line}: unexpected end of file: expected {expected}")]
    UnexpectedEOF { line: usize, expected: String },
    #[error("invalid metadata: {0}")]
    InvalidMetadata(#[from] serde_yaml::Error),
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Parser { tokens, pos: 0 }
    }

    fn peek(&self) -> Option<&Token> {
        self.tokens.get(self.pos)
    }

    fn unexpected_error(&self, expected: &str) -> ParseError {
        match self.peek() {
            Some(token) => ParseError::UnexpectedToken {
                line: token.line,
                expected: expected.to_string(),
                got: token.kind.clone(),
            },
            None => ParseError::UnexpectedEOF {
                expected: expected.to_string(),
                line: self.tokens.last().map_or(0, |t| t.line),
            },
        }
    }

    fn peek_kind(&self) -> Option<&TokenKind> {
        self.tokens.get(self.pos).map(|t| &t.kind)
    }

    fn advance(&mut self) -> Option<&Token> {
        let token = self.tokens.get(self.pos);
        self.pos += 1;
        token
    }

    fn advance_while(&mut self, cond: impl Fn(&Token) -> bool) {
        while self.peek().is_some_and(&cond) {
            self.advance();
        }
    }

    fn skip_blanklines(&mut self) {
        self.advance_while(|k| matches!(k.kind, TokenKind::BlankLine));
    }

    fn parse_metadata_lines(&mut self) -> Result<Vec<String>, ParseError> {
        let mut lines = Vec::new();
        loop {
            self.skip_blanklines();
            match self.peek_kind() {
                Some(TokenKind::Metadata(text)) => {
                    lines.push(text.clone());
                    self.advance();
                }
                _ => break,
            }
        }
        Ok(lines)
    }

    fn parse_text_block(&mut self) -> Option<String> {
        let mut lines = Vec::new();
        while let Some(Token {
            kind: TokenKind::Text(_),
            content,
            ..
        }) = self.peek()
        {
            lines.push(content.clone());
            self.advance();
        }
        if lines.is_empty() {
            None
        } else {
            Some(lines.join("\n"))
        }
    }

    fn parse_answer(&mut self) -> Result<Answer, ParseError> {
        let (label, text, correct) = match self.peek_kind() {
            Some(TokenKind::IncorrectAnswer { label, text }) => {
                (label.clone(), text.clone(), false)
            }
            Some(
                TokenKind::CorrectAnswer { label, text }
                | TokenKind::MultiCorrectAnswer { label, text },
            ) => (label.clone(), text.clone(), true),
            _ => return Err(self.unexpected_error("answer option")),
        };
        self.advance();

        let mut notes = Vec::new();
        while let Some(Token {
            kind: TokenKind::Text(note),
            ..
        }) = self.peek()
        {
            notes.push(note.clone());
            self.advance();
        }

        Ok(Answer {
            label,
            text,
            notes: match &notes[..] {
                [] => None,
                n => Some(n.join("\n")),
            },
            correct,
        })
    }

    fn parse_question_single_choice(
        &mut self,
        mut answers: Vec<Answer>,
    ) -> Result<Question, ParseError> {
        loop {
            self.skip_blanklines();
            match self.peek() {
                Some(token) if token.is_single_choice() => {
                    answers.push(self.parse_answer()?);
                }
                _ => break,
            }
        }

        Ok(Question::SingleChoice { answers })
    }

    fn parse_question_multi_choice(
        &mut self,
        mut answers: Vec<Answer>,
    ) -> Result<Question, ParseError> {
        loop {
            self.skip_blanklines();
            match self.peek() {
                Some(token) if token.is_multi_choice() => {
                    answers.push(self.parse_answer()?);
                }
                _ => break,
            }
        }
        Ok(Question::MultiChoice { answers })
    }

    fn parse_question_categories(&mut self) -> Result<Question, ParseError> {
        let mut categories = Vec::new();
        loop {
            self.skip_blanklines();
            match self.peek_kind() {
                Some(TokenKind::CategoryHeader { text }) => {
                    let header = text.to_string();
                    self.advance();
                    let answers = self.parse_incorrect_answers()?;
                    categories.push(Category {
                        text: header,
                        answers,
                    });
                }
                _ => break,
            }
        }
        Ok(Question::Categorize { categories })
    }

    fn parse_incorrect_answers(&mut self) -> Result<Vec<Answer>, ParseError> {
        let mut answers = Vec::new();
        loop {
            match self.peek() {
                Some(token) if token.is_incorrect() => answers.push(self.parse_answer()?),
                _ => break,
            };
        }
        Ok(answers)
    }

    fn parse_question(&mut self) -> Result<Question, ParseError> {
        self.skip_blanklines();

        if let Some(token) = self.peek()
            && token.is_category()
        {
            return self.parse_question_categories();
        }

        let mut answers = self.parse_incorrect_answers()?;

        match self.peek() {
            Some(token) if token.is_single_choice() && answers.is_empty() => {
                let answer = self.parse_answer()?;
                Ok(Question::FreeInput { answer })
            }
            Some(token) if token.is_single_choice() => {
                answers.push(self.parse_answer()?);
                self.parse_question_single_choice(answers)
            }
            Some(token) if token.is_multi_choice() => {
                answers.push(self.parse_answer()?);
                self.parse_question_multi_choice(answers)
            }
            _ => Err(self.unexpected_error("answer choices")),
        }
    }

    fn parse_section(
        &mut self,
        header: String,
        min_heading_level: u8,
    ) -> Result<Section, ParseError> {
        let mut text_blocks = Vec::new();
        let mut metadata_lines = Vec::new();
        loop {
            self.skip_blanklines();
            match self.peek() {
                Some(token) if token.is_text() => {
                    if let Some(block) = self.parse_text_block() {
                        text_blocks.push(block);
                    }
                }
                Some(token) if token.is_metadata() => {
                    metadata_lines.extend(self.parse_metadata_lines()?)
                }
                _ => break,
            }
        }

        let question = match self.peek() {
            Some(token) if token.is_question() => Some(self.parse_question()?),
            _ => None,
        };

        let metadata = if !metadata_lines.is_empty() {
            Some(self.parse_metadata(&metadata_lines.join("\n"))?)
        } else {
            None
        };

        let text = if !text_blocks.is_empty() {
            Some(text_blocks.join("\n\n"))
        } else {
            None
        };

        Ok(Section {
            header,
            metadata,
            text,
            question,
            items: self.parse_items(min_heading_level + 1)?,
        })
    }

    fn parse_items(&mut self, min_heading_level: u8) -> Result<Vec<Section>, ParseError> {
        let mut items = Vec::new();
        loop {
            self.skip_blanklines();
            match self.peek() {
                Some(Token {
                    kind: TokenKind::Heading { text, level },
                    ..
                }) => {
                    if *level < min_heading_level {
                        break; // heading belongs to parent scope
                    }
                    let header = text.to_string();
                    let next_level = *level;
                    self.advance();
                    items.push(self.parse_section(header, next_level)?);
                }
                Some(_) => return Err(self.unexpected_error("heading")),
                None => return Ok(items),
            }
        }
        Ok(items)
    }

    fn parse_metadata(&self, string_data: &str) -> Result<serde_yaml::Value, ParseError> {
        let value: serde_yaml::Value = serde_yaml::from_str(string_data)?;
        Ok(value)
    }

    fn parse_quiz(&mut self) -> Result<Quiz, ParseError> {
        self.skip_blanklines();
        let frontmatter = match self.peek_kind() {
            Some(TokenKind::Frontmatter(text)) => {
                let text = text.clone();
                self.advance();
                Some(serde_yaml::from_str(&text)?)
            }
            _ => None,
        };
        let items = self.parse_items(1)?;
        Ok(Quiz { frontmatter, items })
    }
}

pub fn parse(tokens: Vec<Token>) -> Result<Quiz, ParseError> {
    let mut parser = Parser::new(tokens);
    parser.parse_quiz()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexer::lex;
    use indoc::indoc;

    fn parse_input(input: &str) -> Result<Quiz, ParseError> {
        let tokens = lex(input).unwrap();
        parse(tokens)
    }

    #[test]
    fn test_empty() {
        let quiz = parse_input("").unwrap();
        assert!(quiz.frontmatter.is_none());
        assert!(quiz.items.is_empty());
    }

    #[test]
    fn test_free_input_question() {
        let input = indoc! {"
            # What is 2 + 2?

            = 4
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert_eq!(section.header, "What is 2 + 2?");
        let Question::FreeInput { answer } = section.question.as_ref().unwrap() else {
            panic!("expected free input question");
        };
        assert_eq!(answer.text, "4");
    }

    #[test]
    fn test_single_choice_question() {
        let input = indoc! {"
            # What is 2 + 2?

            - 2
            = 4
            - 3
            - 1
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert_eq!(section.header, "What is 2 + 2?");
        let Question::SingleChoice { answers } = section.question.as_ref().unwrap() else {
            panic!("expected single choice question");
        };
        match &answers[..] {
            [a, b, c, d] => {
                assert_eq!(a.text, "2");
                assert!(!a.correct);
                assert_eq!(b.text, "4");
                assert!(b.correct);
                assert_eq!(c.text, "3");
                assert!(!c.correct);
                assert_eq!(d.text, "1");
                assert!(!d.correct);
            }
            _ => panic!("expected 4 answers"),
        };
    }

    #[test]
    fn test_multi_choice_question() {
        let input = indoc! {"
            # Which are prime numbers?

            - 4
            + 2
            + 3
            - 6
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert_eq!(section.header, "Which are prime numbers?");
        let Question::MultiChoice { answers } = section.question.as_ref().unwrap() else {
            panic!("expected multi choice question");
        };
        assert_eq!(answers.len(), 4);
        assert!(!answers[0].correct);
        assert!(answers[1].correct);
        assert_eq!(answers[1].text, "2");
        assert!(answers[2].correct);
        assert!(!answers[3].correct);
    }

    #[test]
    fn test_categorize_question() {
        let input = indoc! {"
            # Sort these by continent

            > Europe
            - France
            - Germany

            > Asia
            - China
            - Japan
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert_eq!(section.header, "Sort these by continent");
        let Question::Categorize { categories } = section.question.as_ref().unwrap() else {
            panic!("expected categorize question");
        };
        assert_eq!(categories.len(), 2);
        assert_eq!(categories[0].text, "Europe");
        assert_eq!(categories[0].answers.len(), 2);
        assert_eq!(categories[0].answers[0].text, "France");
        assert_eq!(categories[1].text, "Asia");
        assert_eq!(categories[1].answers[1].text, "Japan");
    }

    #[test]
    fn test_frontmatter() {
        let input = indoc! {"
            ---
            name: My Quiz
            category: Test
            ---

            # What is 1 + 1?

            = 2
        "};
        let quiz = parse_input(input).unwrap();
        assert!(quiz.frontmatter.is_some());
        let fm = quiz.frontmatter.unwrap();
        assert_eq!(fm["name"], "My Quiz");
        assert_eq!(fm["category"], "Test");
        assert_eq!(quiz.items.len(), 1);
    }

    #[test]
    fn test_sections() {
        let input = indoc! {"
            # Math

            What is 1 + 1?

            = 2

            ## Geometry

            What shape has 3 sides?

            = triangle
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert_eq!(section.header, "Math");
        let Some(text) = &section.text else {
            panic!("expected section text")
        };
        assert_eq!(text, "What is 1 + 1?");
        assert!(section.question.is_some());
        assert_eq!(section.items.len(), 1);

        let subsection = &section.items[0];
        assert_eq!(subsection.header, "Geometry");
        let Some(text) = &subsection.text else {
            panic!("expected subsection text")
        };
        assert_eq!(text, "What shape has 3 sides?");
        assert!(subsection.question.is_some());
    }

    #[test]
    fn test_answer_with_notes() {
        let input = indoc! {"
            # Which country is largest?

            - India
            = Russia
            Note: by land area
            - China
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        let Question::SingleChoice { answers } = section.question.as_ref().unwrap() else {
            panic!("expected single choice");
        };
        assert_eq!(answers[1].text, "Russia");
        assert_eq!(answers[1].notes.as_deref(), Some("Note: by land area"));
    }

    #[test]
    fn test_labeled_options() {
        let input = indoc! {"
            # What is the capital of France?

            (a) London
            (b) Berlin
            = (c) Paris
            (d) Bangkok
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        let Question::SingleChoice { answers } = section.question.as_ref().unwrap() else {
            panic!("expected single choice");
        };
        assert_eq!(answers.len(), 4);
        assert_eq!(answers[0].label.as_deref(), Some("a"));
        assert_eq!(answers[2].text, "Paris");
        assert_eq!(answers[2].label.as_deref(), Some("c"));
        assert!(answers[2].correct);
    }

    #[test]
    fn test_section_metadata() {
        let input = indoc! {"
            # What is 2 + 2?

            @when: on_correct
            @difficulty: easy

            = 4
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        let metadata = section.metadata.as_ref().unwrap();
        assert_eq!(metadata["when"], "on_correct");
        assert_eq!(metadata["difficulty"], "easy");
        assert!(section.question.is_some());
    }

    #[test]
    fn test_section_metadata_with_text() {
        let input = indoc! {"
            # A question

            @shuffle: true

            Some explanatory text

            = answer
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        let metadata = section.metadata.as_ref().unwrap();
        assert_eq!(metadata["shuffle"], true);
        let text = section.text.as_ref().unwrap();
        assert_eq!(text, "Some explanatory text");
    }

    #[test]
    fn test_section_no_metadata() {
        let input = indoc! {"
            # Simple question

            = 42
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        assert!(section.metadata.is_none());
    }

    #[test]
    fn test_metadata_between_text() {
        let input = indoc! {"
            # A question

            First paragraph

            @difficulty: hard
            @category: math

            Second paragraph

            = answer
        "};
        let quiz = parse_input(input).unwrap();
        let section = &quiz.items[0];
        let metadata = section.metadata.as_ref().unwrap();
        assert_eq!(metadata["difficulty"], "hard");
        assert_eq!(metadata["category"], "math");
        let text = section.text.as_ref().unwrap();
        assert!(text.contains("First paragraph"));
        assert!(text.contains("Second paragraph"));
    }

    #[test]
    fn test_frontmatter_and_section_metadata() {
        let input = indoc! {"
            ---
            name: My Quiz
            ---

            # Question 1

            @when: always

            = yes
        "};
        let quiz = parse_input(input).unwrap();
        assert_eq!(quiz.frontmatter.as_ref().unwrap()["name"], "My Quiz");
        let section = &quiz.items[0];
        assert_eq!(section.metadata.as_ref().unwrap()["when"], "always");
    }
}

use crate::ast::*;
use crate::token::{Token, TokenKind};

struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

#[derive(Debug)]
pub struct ParseError {
    pub line: usize,
    pub message: String,
}

impl ParseError {
    fn unexpected_token(token: &Token, expected: &str) -> Self {
        ParseError {
            line: token.line,
            message: format!(
                "unexpected token: expected {}, got {:?}",
                expected, token.kind
            ),
        }
    }

    fn unexpected_eof(expected: &str, line: usize) -> Self {
        ParseError {
            line,
            message: format!("unexpected end of file: expected {}", expected),
        }
    }
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
            Some(token) => ParseError::unexpected_token(token, expected),
            None => ParseError::unexpected_eof(expected, self.tokens.last().map_or(0, |t| t.line)),
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

    fn collect_while(&mut self, cond: impl Fn(&Token) -> bool) -> Vec<&Token> {
        let mut result = Vec::new();
        while let Some(token) = self.peek() {
            if !cond(token) {
                break;
            }
            result.push(&self.tokens[self.pos]);
            self.pos += 1;
        }
        result
    }

    fn skip_blanklines(&mut self) {
        self.advance_while(|k| matches!(k.kind, TokenKind::BlankLine));
    }

    fn parse_frontmatter(&mut self) -> Result<Option<String>, ParseError> {
        self.skip_blanklines();
        if !self
            .peek_kind()
            .is_some_and(|k| matches!(k, TokenKind::FrontmatterDelimiter))
        {
            return Ok(None);
        }
        self.advance();

        let mut lines = Vec::new();
        loop {
            match self.advance() {
                Some(Token {
                    kind: TokenKind::FrontmatterDelimiter,
                    ..
                }) => {
                    return Ok(Some(lines.join("\n")));
                }
                Some(Token { content, .. }) => {
                    lines.push(content.clone());
                }
                None => {
                    return Err(ParseError::unexpected_eof(
                        "closing ---",
                        self.tokens.last().map_or(0, |t| t.line),
                    ));
                }
            }
        }
    }

    fn parse_question_text(&mut self) -> Result<String, ParseError> {
        let mut lines = Vec::new();
        while let Some(Token {
            kind: TokenKind::Text(_) | TokenKind::BlankLine,
            content,
            ..
        }) = self.peek()
        {
            lines.push(content.clone());
            self.advance();
        }
        let text = lines.join("\n").trim().to_string();
        if text.is_empty() {
            return Err(self.unexpected_error("question text"));
        };
        Ok(text)
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
        text: String,
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

        Ok(Question::SingleChoice { text, answers })
    }

    fn parse_question_multi_choice(
        &mut self,
        text: String,
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
        Ok(Question::MultiChoice { text, answers })
    }

    fn parse_question_categories(&mut self, text: String) -> Result<Question, ParseError> {
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
        Ok(Question::Categorize { text, categories })
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
        let text = self.parse_question_text()?;

        self.skip_blanklines();

        if let Some(token) = self.peek()
            && token.is_category()
        {
            return self.parse_question_categories(text);
        }

        let mut answers = self.parse_incorrect_answers()?;

        match self.peek() {
            Some(token) if token.is_single_choice() && answers.is_empty() => {
                let answer = self.parse_answer()?;
                Ok(Question::FreeInput { answer, text })
            }
            Some(token) if token.is_single_choice() => {
                answers.push(self.parse_answer()?);
                self.parse_question_single_choice(text, answers)
            }
            Some(token) if token.is_multi_choice() => {
                answers.push(self.parse_answer()?);
                self.parse_question_multi_choice(text, answers)
            }
            _ => Err(self.unexpected_error("answer choices")),
        }
    }

    fn parse_items(&mut self, min_heading_level: u8) -> Result<Vec<Item>, ParseError> {
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
                    items.push(Item::Section(Section {
                        header,
                        items: self.parse_items(next_level + 1)?,
                    }));
                }
                Some(token) if token.is_text() => {
                    items.push(Item::Question(self.parse_question()?))
                }
                Some(token) => {
                    return Err(ParseError::unexpected_token(
                        token,
                        "heading or question text",
                    ));
                }
                None => return Ok(items),
            }
        }
        Ok(items)
    }

    fn parse_quiz(&mut self) -> Result<Quiz, ParseError> {
        let frontmatter = self.parse_frontmatter()?;
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
        let tokens = lex(input);
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
            What is 2 + 2?

            = 4
        "};
        let quiz = parse_input(input).unwrap();
        assert!(quiz.frontmatter.is_none());
        let Item::Question(ref question) = quiz.items[0] else {
            panic!("expected question");
        };
        let Question::FreeInput { text, answer } = question else {
            panic!("expected free input question");
        };
        assert!(text == "What is 2 + 2?");
        assert!(answer.text == "4");
    }

    #[test]
    fn test_single_choice_question() {
        let input = indoc! {"
            What is 2 + 2?

            - 2
            = 4
            - 3
            - 1
        "};
        let quiz = parse_input(input).unwrap();
        assert!(quiz.frontmatter.is_none());
        let Item::Question(ref question) = quiz.items[0] else {
            panic!("expected question");
        };
        let Question::SingleChoice { text, answers } = question else {
            panic!("expected single choice question");
        };
        assert!(text == "What is 2 + 2?");
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
          Which are prime numbers?

          - 4
          + 2
          + 3
          - 6
      "};
        let quiz = parse_input(input).unwrap();
        let Question::MultiChoice { text, answers } = quiz.items[0].as_question().unwrap() else {
            panic!("expected multi choice question");
        };
        assert_eq!(text, "Which are prime numbers?");
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
          Sort these by continent

          > Europe
          - France
          - Germany

          > Asia
          - China
          - Japan
      "};
        let quiz = parse_input(input).unwrap();
        let Question::Categorize { text, categories } = quiz.items[0].as_question().unwrap() else {
            panic!("expected categorize question");
        };
        assert_eq!(text, "Sort these by continent");
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

          What is 1 + 1?

          = 2
      "};
        let quiz = parse_input(input).unwrap();
        assert!(quiz.frontmatter.is_some());
        assert!(quiz.frontmatter.unwrap().contains("name: My Quiz"));
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
        let section = quiz.items[0].as_section().unwrap();
        assert_eq!(section.header, "Math");
        assert_eq!(section.items.len(), 2);

        let subsection = section.items[1].as_section().unwrap();
        assert_eq!(subsection.header, "Geometry");
        assert_eq!(subsection.items.len(), 1);
    }

    #[test]
    fn test_answer_with_notes() {
        let input = indoc! {"
          Which country is largest?

          - India
          = Russia
          Note: by land area
          - China
      "};
        let quiz = parse_input(input).unwrap();
        let Question::SingleChoice { answers, .. } = quiz.items[0].as_question().unwrap() else {
            panic!("expected single choice");
        };
        assert_eq!(answers[1].text, "Russia");
        assert_eq!(answers[1].notes.as_deref(), Some("Note: by land area"));
    }

    #[test]
    fn test_labeled_options() {
        let input = indoc! {"
          What is the capital of France?

          (a) London
          (b) Berlin
          = (c) Paris
          (d) Bangkok
      "};
        let quiz = parse_input(input).unwrap();
        let Question::SingleChoice { answers, .. } = quiz.items[0].as_question().unwrap() else {
            panic!("expected single choice");
        };
        assert_eq!(answers.len(), 4);
        assert_eq!(answers[0].label.as_deref(), Some("a"));
        assert_eq!(answers[2].text, "Paris");
        assert_eq!(answers[2].label.as_deref(), Some("c"));
        assert!(answers[2].correct);
    }
}

use crate::token::{Token, TokenKind};

use thiserror::Error;

struct Lexer<'a> {
    lines: Vec<&'a str>,
    pos: usize,
}

#[derive(Debug, Error)]
pub enum LexError {
    #[error("line {line}: unclosed {block}: expected {expected}")]
    UnclosedBlock {
        line: usize,
        expected: String,
        block: String,
    },
}

impl<'a> Lexer<'a> {
    fn new(input: &'a str) -> Self {
        Lexer {
            lines: input.lines().collect(),
            pos: 0,
        }
    }

    fn peek(&self) -> Option<&str> {
        self.lines.get(self.pos).copied()
    }

    fn advance(&mut self) -> Option<&str> {
        let line = self.lines.get(self.pos).copied();
        self.pos += 1;
        line
    }

    fn line_number(&self) -> usize {
        self.pos + 1
    }

    fn lex_frontmatter(&mut self) -> Result<Option<Token>, LexError> {
        while self.peek().is_some_and(|l| l.trim().is_empty()) {
            self.advance();
        }
        if self.peek().is_none_or(|l| l.trim() != "---") {
            self.pos = 0;
            return Ok(None);
        }
        let start_line = self.line_number();
        self.advance();

        let mut lines = Vec::new();
        loop {
            let line = match self.advance() {
                Some(line) => line.to_string(),
                None => {
                    return Err(LexError::UnclosedBlock {
                        line: self.line_number(),
                        block: "---".to_string(),
                        expected: "---".to_string(),
                    });
                }
            };

            if line.trim() == "---" {
                break;
            }

            lines.push(line);
        }

        Ok(Some(Token {
            kind: TokenKind::Frontmatter(lines.join("\n")),
            line: start_line,
            content: String::new(),
        }))
    }

    fn lex_line_token_kind(&self, line: &str) -> TokenKind {
        if line.trim().is_empty() {
            TokenKind::BlankLine
        } else if let Some((level, text)) = self.parse_heading(line) {
            TokenKind::Heading { level, text }
        } else if let Some((label, text)) = self.parse_marker_line(line, '=') {
            TokenKind::CorrectAnswer { label, text }
        } else if let Some((label, text)) = self.parse_marker_line(line, '+') {
            TokenKind::MultiCorrectAnswer { label, text }
        } else if let Some((label, text)) = self.parse_marker_line(line, '-') {
            TokenKind::IncorrectAnswer { label, text }
        } else if let Some(text) = self.strip_marker(line, '>') {
            TokenKind::CategoryHeader { text }
        } else if let Some((index, text)) = self.parse_sort_item_line(line) {
            TokenKind::SortItem { index, text }
        } else if let Some((left, right)) = self.parse_match_pair_line(line) {
            TokenKind::MatchPair { left, right }
        } else if let (Some(label), text) = self.extract_label(line) {
            TokenKind::IncorrectAnswer {
                label: Some(label),
                text,
            }
        } else if let Some(text) = line.trim().strip_prefix('@') {
            TokenKind::Metadata(text.trim().to_string())
        } else {
            TokenKind::Text(line.to_string())
        }
    }

    fn parse_heading(&self, line: &str) -> Option<(u8, String)> {
        let level = line.chars().take_while(|&c| c == '#').count();
        if level == 0 {
            return None;
        }
        let rest = &line[level..];
        if rest.starts_with(' ') {
            Some((level as u8, rest.trim_start().to_string()))
        } else {
            None
        }
    }

    fn parse_marker_line(&self, line: &str, marker: char) -> Option<(Option<String>, String)> {
        let text = self.strip_marker(line, marker)?;
        let (label, rest) = self.extract_label(&text);
        Some((label, rest))
    }

    fn strip_marker(&self, line: &str, marker: char) -> Option<String> {
        let first = line.chars().next()?;
        if first != marker {
            return None;
        }
        let rest = &line[1..];
        if rest.starts_with(' ') {
            Some(rest.trim_start().to_string())
        } else {
            None
        }
    }

    fn parse_sort_item_line(&self, line: &str) -> Option<(u32, String)> {
        let trimmed = line.trim_start();
        let digit_end = trimmed.find(|c: char| !c.is_ascii_digit())?;
        if digit_end == 0 {
            return None;
        }
        let rest = &trimmed[digit_end..];
        if !rest.starts_with(". ") {
            return None;
        }
        let index: u32 = trimmed[..digit_end].parse().ok()?;
        let text = rest[2..].trim().to_string();
        if text.is_empty() {
            return None;
        }
        Some((index, text))
    }

    fn parse_match_pair_line(&self, line: &str) -> Option<(String, String)> {
        let trimmed = line.trim_start();
        if !trimmed.starts_with('~') {
            return None;
        }
        let rest = &trimmed[1..];
        if !rest.starts_with(' ') {
            return None;
        }
        let rest = rest.trim_start();
        let sep = rest.find("==")?;
        let left = rest[..sep].trim().to_string();
        let right = rest[sep + 2..].trim().to_string();
        if left.is_empty() || right.is_empty() {
            return None;
        }
        Some((left, right))
    }

    fn extract_label(&self, line: &str) -> (Option<String>, String) {
        let trimmed = line.trim_start();
        if !trimmed.starts_with('(') {
            return (None, line.to_string());
        }

        let close = match trimmed.find(')') {
            Some(c) if c > 1 => c,
            _ => return (None, line.to_string()),
        };

        let label = &trimmed[1..close];
        let rest = trimmed[close + 1..].trim_start();
        (Some(label.to_string()), rest.to_string())
    }

    pub fn lex(&mut self) -> Result<Vec<Token>, LexError> {
        let mut tokens = Vec::new();

        if let Some(frontmatter) = self.lex_frontmatter()? {
            tokens.push(frontmatter);
        }

        loop {
            let line = match self.advance() {
                Some(line) => line.to_string(),
                None => break,
            };

            let line_num = self.line_number();
            let kind = self.lex_line_token_kind(&line);
            let token = Token {
                kind,
                line: line_num,
                content: line.to_string(),
            };
            tokens.push(token);
        }

        Ok(tokens)
    }
}

pub fn lex(input: &str) -> Result<Vec<Token>, LexError> {
    Lexer::new(input).lex()
}

#[cfg(test)]
mod tests {
    use super::*;
    use indoc::indoc;

    #[test]
    fn test_empty_line() {
        let tokens = lex("").unwrap();
        assert_eq!(tokens.len(), 0);
    }

    #[test]
    fn test_blank_line() {
        let tokens = lex(" ").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(tokens[0].kind, TokenKind::BlankLine);
    }

    #[test]
    fn test_frontmatter() {
        let input = indoc! {"
            ---
            some: frontmatter
            key: value
            ---
        "};
        let tokens = lex(input).unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::Frontmatter("some: frontmatter\nkey: value".to_string())
        );
    }

    #[test]
    fn test_frontmatter_with_whitespace() {
        let input = indoc! {"
             ---
            some: frontmatter
             ---
        "};
        let tokens = lex(input).unwrap();
        assert_eq!(tokens.len(), 1);
        assert!(matches!(tokens[0].kind, TokenKind::Frontmatter(_)));
    }

    #[test]
    fn test_inline_metadata() {
        let tokens = lex("@when: on_correct").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::Metadata("when: on_correct".to_string())
        );
    }

    #[test]
    fn test_unclosed_metadata_block() {
        let input = indoc! {"
            ---
            some: frontmatter
        "};
        let result = Lexer::new(input).lex();
        assert!(result.is_err());
    }

    #[test]
    fn test_correct_option() {
        let tokens = lex("= Option A").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::CorrectAnswer {
                label: None,
                text: "Option A".to_string()
            }
        );
    }

    #[test]
    fn test_multi_correct_option() {
        let tokens = lex("+ Option A").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::MultiCorrectAnswer {
                label: None,
                text: "Option A".to_string()
            }
        );
    }

    #[test]
    fn test_incorrect_option() {
        let tokens = lex("- Option A").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::IncorrectAnswer {
                label: None,
                text: "Option A".to_string()
            }
        );
    }

    #[test]
    fn test_sort_item() {
        let tokens = lex("1. First item").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::SortItem {
                index: 1,
                text: "First item".to_string()
            }
        );
    }

    #[test]
    fn test_sort_item_large_index() {
        let tokens = lex("42. Item forty-two").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::SortItem {
                index: 42,
                text: "Item forty-two".to_string()
            }
        );
    }

    #[test]
    fn test_match_pair() {
        let tokens = lex("~ Paris == France").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::MatchPair {
                left: "Paris".to_string(),
                right: "France".to_string()
            }
        );
    }

    #[test]
    fn test_match_pair_extra_spaces() {
        let tokens = lex("~  Berlin  ==  Germany ").unwrap();
        assert_eq!(tokens.len(), 1);
        assert_eq!(
            tokens[0].kind,
            TokenKind::MatchPair {
                left: "Berlin".to_string(),
                right: "Germany".to_string()
            }
        );
    }

    #[test]
    fn test_full_question() {
        let input = indoc! {"
            Text

            - (a) Option A
            (b) Option B
            = (c) Option C
        "};
        let tokens = lex(input).unwrap();
        assert_eq!(tokens.len(), 5);
        assert_eq!(tokens[0].kind, TokenKind::Text("Text".to_string()));
        assert_eq!(tokens[1].kind, TokenKind::BlankLine);
        assert_eq!(
            tokens[2].kind,
            TokenKind::IncorrectAnswer {
                label: Some("a".to_string()),
                text: "Option A".to_string()
            }
        );
        assert_eq!(
            tokens[3].kind,
            TokenKind::IncorrectAnswer {
                label: Some("b".to_string()),
                text: "Option B".to_string()
            }
        );
        assert_eq!(
            tokens[4].kind,
            TokenKind::CorrectAnswer {
                label: Some("c".to_string()),
                text: "Option C".to_string()
            }
        );
    }
}

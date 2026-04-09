#[derive(Debug, PartialEq, Clone)]
pub enum TokenKind {
    Frontmatter(String),
    Metadata(String),
    Heading { level: u8, text: String },
    CorrectAnswer { label: Option<String>, text: String },
    MultiCorrectAnswer { label: Option<String>, text: String },
    IncorrectAnswer { label: Option<String>, text: String },
    CategoryHeader { text: String },
    Text(String),
    BlankLine,
}

#[derive(Debug, PartialEq)]
pub struct Token {
    pub kind: TokenKind,
    pub line: usize,
    pub content: String,
}

impl Token {
    pub fn is_answer(&self) -> bool {
        matches!(
            self.kind,
            TokenKind::CorrectAnswer { .. }
                | TokenKind::MultiCorrectAnswer { .. }
                | TokenKind::IncorrectAnswer { .. }
        )
    }

    pub fn is_correct(&self) -> bool {
        matches!(
            self.kind,
            TokenKind::CorrectAnswer { .. } | TokenKind::MultiCorrectAnswer { .. }
        )
    }

    pub fn is_single_choice(&self) -> bool {
        matches!(
            self.kind,
            TokenKind::CorrectAnswer { .. } | TokenKind::IncorrectAnswer { .. }
        )
    }

    pub fn is_multi_choice(&self) -> bool {
        matches!(
            self.kind,
            TokenKind::MultiCorrectAnswer { .. } | TokenKind::IncorrectAnswer { .. }
        )
    }

    pub fn is_category(&self) -> bool {
        matches!(self.kind, TokenKind::CategoryHeader { .. })
    }

    pub fn is_question(&self) -> bool {
        self.is_answer() || self.is_category()
    }

    pub fn is_text(&self) -> bool {
        matches!(self.kind, TokenKind::Text(_))
    }

    pub fn is_metadata(&self) -> bool {
        matches!(self.kind, TokenKind::Metadata(_))
    }

    pub fn is_frontmatter(&self) -> bool {
        matches!(self.kind, TokenKind::Frontmatter(_))
    }

    pub fn is_incorrect(&self) -> bool {
        matches!(self.kind, TokenKind::IncorrectAnswer { .. })
    }
}

#[derive(Debug)]
pub struct Quiz {
    pub frontmatter: Option<String>,
    pub items: Vec<Item>,
}

#[derive(Debug)]
pub struct Section {
    pub header: String,
    pub items: Vec<Item>,
}

#[derive(Debug)]
pub enum Question {
    FreeInput {
        text: String,
        answer: Answer,
    },
    SingleChoice {
        text: String,
        answers: Vec<Answer>,
    },
    MultiChoice {
        text: String,
        answers: Vec<Answer>,
    },
    Categorize {
        text: String,
        categories: Vec<Category>,
    },
}

impl Question {
    pub fn get_text(&self) -> String {
        match self {
            Question::FreeInput { text, .. }
            | Question::SingleChoice { text, .. }
            | Question::MultiChoice { text, .. }
            | Question::Categorize { text, .. } => text.to_string(),
        }
    }
}

#[derive(Debug)]
pub enum Item {
    Section(Section),
    Question(Question),
}

impl Item {
    pub fn as_question(&self) -> Option<&Question> {
        match self {
            Item::Question(q) => Some(q),
            _ => None,
        }
    }

    pub fn as_section(&self) -> Option<&Section> {
        match self {
            Item::Section(s) => Some(s),
            _ => None,
        }
    }
}

#[derive(Debug)]
pub struct Category {
    pub text: String,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Clone)]
pub struct Answer {
    pub label: Option<String>,
    pub text: String,
    pub notes: Option<String>,
    pub correct: bool,
}

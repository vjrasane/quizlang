use ::serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Quiz {
    pub frontmatter: Option<serde_yaml::Value>,
    pub items: Vec<Section>,
}

#[derive(Debug, Serialize, Clone)]
pub struct Section {
    pub header: String,
    pub text: Option<String>,
    pub metadata: Option<serde_yaml::Value>,
    pub question: Option<Question>,
    pub items: Vec<Section>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
pub enum Question {
    FreeInput { answer: Answer },
    SingleChoice { answers: Vec<Answer> },
    MultiChoice { answers: Vec<Answer> },
    Categorize { categories: Vec<Category> },
}

#[derive(Debug, Clone, Serialize)]
pub struct Category {
    pub text: String,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Answer {
    pub label: Option<String>,
    pub text: String,
    pub notes: Option<String>,
    pub correct: bool,
}

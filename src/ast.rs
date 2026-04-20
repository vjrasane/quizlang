use ::serde::Serialize;
use schemars::JsonSchema;

#[derive(Debug, Serialize, JsonSchema)]
pub struct Quiz {
    pub frontmatter: Option<serde_json::Value>,
    pub items: Vec<Section>,
}

#[derive(Debug, Serialize, Clone, JsonSchema)]
pub struct Section {
    pub header: String,
    pub text: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub question: Option<Question>,
    pub items: Vec<Section>,
}

#[derive(Debug, Serialize, Clone, JsonSchema)]
#[serde(tag = "type")]
pub enum Question {
    FreeInput { answer: Answer },
    SingleChoice { answers: Vec<Answer> },
    MultiChoice { answers: Vec<Answer> },
    Categorize { categories: Vec<Category> },
    Sorting { items: Vec<SortItem> },
    Matching { pairs: Vec<MatchPair> },
}

#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Category {
    pub text: String,
    pub answers: Vec<Answer>,
}

#[derive(Debug, Clone, Serialize, PartialEq, JsonSchema)]
pub struct SortItem {
    pub text: String,
    pub key: u32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, JsonSchema)]
pub struct MatchPair {
    pub left: String,
    pub right: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, JsonSchema)]
pub struct Answer {
    pub label: Option<String>,
    pub text: String,
    pub notes: Option<String>,
    pub correct: bool,
}

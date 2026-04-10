---
name: generate-quiz
description: Generate a quizlang quiz file from instructions or a source file
user_invocable: true
allowed_tools:
  - Bash(web/scripts/fetch-youtube-transcript *)
  - Bash(web/scripts/extract-pdf-text *)
  - Bash(quiz *)
  - WebFetch
  - WebSearch
  - Write(web/quizzes/*)
  - Write(quizzes/*)
  - Read
---

# Generate Quizzes

Generate quizlang quiz files. The user provides either:
- Direct instructions (e.g. "generate a quiz about the solar system in Finnish")
- A path to a source file to generate from

## Steps

1. Gather the source material:
   - **Direct instructions**: Follow them. Use WebSearch/WebFetch if you need to research a topic.
   - **Source file (text/notes)**: Read the file, use the content directly.
   - **Source file with instructions**: Read the file, follow the instructions within (may point to URLs, YouTube videos, etc.)
   - **YouTube URL in source**: Run `web/scripts/fetch-youtube-transcript <url>` to get the transcript.
   - **PDF source**: Run `web/scripts/extract-pdf-text <path>` to extract text.

2. Generate a quizlang file from the gathered content.
   - Follow any language instructions. If no language is specified, match the language of the source material or instructions.

3. Choose a descriptive filename based on the quiz content (e.g. `solar-system.quiz`, `european-capitals.quiz`). If a file with that name already exists in `web/quizzes/`, ask the user whether to overwrite or suggest an alternative name.

4. Write the output to `web/quizzes/<filename>`.

5. Validate by running `quiz parse <output-file>`. If validation fails, read the error, fix the quiz content, and retry.

## Quizlang Format

Every quiz MUST include a frontmatter block:

```
---
name: Descriptive quiz title
category: Subject Area
language: en
tags:
  - tag1
  - tag2
---
```

The `language` field must be an ISO 639-1 code (e.g. `en`, `fi`, `fr`, `es`, `de`, `ja`) matching the language of the quiz content.

Questions are headings followed by answers:

```
# Question text here?

= Correct answer
- Wrong answer 1
- Wrong answer 2
- Wrong answer 3
```

### Question Types

- **Single choice**: `= correct`, `- incorrect` (include 3-4 wrong answers)
- **Multi-select**: `+ correct`, `- incorrect`
- **Free input**: `= answer` (only one answer, no wrong options -- use sparingly)
- **Categorization**: `> category` followed by `- items`
- **Labeled options**: `(a) answer text`
- **Metadata**: `@key: value` on a section
- **Body text**: Optional text between heading and answers. CRITICAL RULES for body text:
  - NEVER reveal or hint at the correct answer in the body text
  - NEVER restate the question as a statement with the answer
  - Only use body text to provide additional context needed to answer the question (e.g. a quote, a scenario, a code snippet)
  - Most questions should have NO body text at all

### Guidelines

- Create varied quizzes with a mix of question types
- Prefer single choice for most questions
- Use multi-select when multiple answers genuinely apply
- Use free input only for short factual answers
- Use categorization when content can be naturally grouped
- Answers can appear in any order (correct before or after incorrect)

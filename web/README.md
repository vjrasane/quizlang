# quizlang-web

## TODO

- [ ] Improve categorize
- [ ] Display answer notes
- [ ] Display question image
- [ ] E2E test for quiz UI
- [ ] Persist quiz state in browser (localStorage)
  - Store answers, current position, and shuffle seed
  - On quiz update (hash mismatch), reset state gracefully instead of erroring
  - Works with shuffled questions by persisting the seed
  - Reset button in player to clear state and restart from beginning
  - Results view at the end: score summary + list of incorrect questions
  - Quiz list page: show status (not started / in progress / completed)

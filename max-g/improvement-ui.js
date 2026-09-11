/** Local improvement views. This module renders data; the caller owns persistence and model work. */
let controlId = 0;

function el(tag, text = '', className = '') {
  const item = document.createElement(tag);
  if (text !== undefined && text !== null) item.textContent = String(text);
  if (className) item.className = className;
  return item;
}

function readableTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : 'Time unavailable';
}

function section(title, description) {
  const card = el('section', '', 'mg-improvement-card');
  card.append(el('h3', title));
  if (description) card.append(el('p', description, 'mg-improvement-muted'));
  return card;
}

function errorRegion() {
  const error = el('p', '', 'mg-improvement-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;
  return error;
}

function actionButton(label, callback, error, { primary = false, danger = false, disabled = false } = {}) {
  const button = el('button', label, `button button-small${primary ? ' button-primary' : ''}${danger ? ' button-danger' : ''}`);
  button.type = 'button';
  button.disabled = disabled || typeof callback !== 'function';
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (error) { error.hidden = true; error.textContent = ''; }
    try { await callback(); }
    catch (problem) {
      if (error) { error.textContent = problem?.message || 'This change could not be completed. Try again.'; error.hidden = false; }
    } finally {
      button.removeAttribute('aria-busy');
      if (button.isConnected) button.disabled = disabled || typeof callback !== 'function';
    }
  });
  return button;
}

function disclosure(title, text) {
  const details = el('details', '', 'mg-improvement-details');
  details.append(el('summary', title), el('pre', text || 'No text recorded.', 'mg-improvement-copy'));
  return details;
}

function row(...items) {
  const wrap = el('div', '', 'mg-improvement-actions');
  wrap.append(...items);
  return wrap;
}

function badge(text, tone = '') { return el('span', text, `mg-improvement-badge${tone ? ` mg-improvement-${tone}` : ''}`); }

/**
 * Feedback is submitted only by Save feedback. onRate receives {rating, correction}.
 * The caller rerenders after persistence; this control never claims a save succeeded.
 */
export function createFeedbackControls({ id, onRate } = {}) {
  const wrap = el('section', '', 'mg-feedback-controls');
  wrap.dataset.feedbackFor = String(id || '');
  wrap.setAttribute('aria-label', 'Feedback for MAX-G response');
  const group = el('div', '', 'mg-feedback-rating');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'How was this response?');
  let rating = '';
  const error = errorRegion();
  const correction = el('textarea');
  correction.rows = 3;
  correction.maxLength = 1500;
  correction.id = `maxg-feedback-correction-${++controlId}`;
  correction.placeholder = 'What should MAX-G do differently next time?';
  const choices = [['helpful', 'Helpful'], ['needs_work', 'Needs work']].map(([value, label]) => {
    const button = el('button', label, 'button button-small mg-feedback-choice');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      rating = value;
      for (const [index, choice] of choices.entries()) choice.setAttribute('aria-pressed', String(index === (value === 'helpful' ? 0 : 1)));
      save.disabled = typeof onRate !== 'function';
    });
    return button;
  });
  group.append(el('span', 'Was this useful?', 'mg-improvement-muted'), ...choices);
  const details = el('details', '', 'mg-feedback-correction');
  const label = el('label', 'Correction or suggestion (optional)');
  label.htmlFor = correction.id;
  details.append(el('summary', 'Add a correction'), el('p', 'Saving feedback keeps a bounded excerpt of the question and answer on this browser, even when chat history is off.', 'mg-improvement-muted'), label, correction);
  const save = actionButton('Save feedback', async () => {
    for (const choice of choices) choice.disabled = true;
    correction.disabled = true;
    try { await onRate({ rating, correction: correction.value.trim() }); }
    finally { for (const choice of choices) choice.disabled = false; correction.disabled = false; }
  }, error);
  save.disabled = true;
  wrap.append(group, details, row(save), error);
  return wrap;
}

/**
 * Pure rendering boundary. Callbacks:
 * onEvaluate(modelId), onApplyLesson(id, enabled), onDeleteLesson(id),
 * onStageLesson(feedbackId), onSaveManualLesson(text), onClearFeedback(),
 * onClearRuns(), onExport(), onCancel(). Optional busy/progress describe an active check.
 * Promises are awaited and failures remain visible. Model changes and downloads are
 * outside this renderer; onEvaluate receives only currentModel.
 */
export function renderImprovementPanel({ state = {}, models = [], currentModel = '', busy = false, progress = '', onEvaluate, onApplyLesson, onDeleteLesson, onStageLesson, onClearFeedback, onClearRuns, onSaveManualLesson, onExport, onCancel } = {}) {
  const feedback = Array.isArray(state.feedback) ? state.feedback : [];
  const lessons = Array.isArray(state.lessons) ? state.lessons : [];
  const runs = Array.isArray(state.runs) ? state.runs : [];
  const knownModels = Array.isArray(models) ? models : [];
  const modelLabel = id => knownModels.find(model => model.id === id)?.label || String(id || 'Model not recorded');
  const panel = el('section', '', 'mg-improvement');
  panel.setAttribute('aria-label', 'Feedback, reviewed lessons and measured checks');
  const overview = section('Make MAX-G more useful to you', 'Your feedback can become small, reviewed reference lessons. Checks show how a local model performed on specific criteria; they do not retrain the model or prove general intelligence.');
  overview.classList.add('mg-improvement-overview');
  overview.prepend(el('span', 'FEEDBACK → REVIEW → CHECK', 'mg-improvement-eyebrow'));
  const stats = el('dl', '', 'mg-improvement-stats');
  for (const [label, value] of [['Feedback saved', feedback.length], ['Lessons enabled', lessons.filter(lesson => lesson.enabled === true).length], ['Checks recorded', runs.length]]) {
    const stat = el('div');
    stat.append(el('dt', label), el('dd', value));
    stats.append(stat);
  }
  const overviewError = errorRegion();
  overview.append(stats, row(actionButton('Export improvement data', onExport, overviewError)), overviewError);
  panel.append(overview);

  const checks = section('Measured model checks', 'Run the same small set of criteria on your currently loaded local model. Inspect the actual answers and conditions before drawing conclusions.');
  const modelField = el('div', '', 'mg-improvement-field');
  modelField.append(el('span', 'Current model'), el('strong', modelLabel(currentModel)));
  const memoryMB = Number(knownModels.find(model => model.id === currentModel)?.memoryMB);
  const modelInfo = el('p', `${Number.isFinite(memoryMB) && memoryMB > 0 ? `Model estimate: ${memoryMB.toLocaleString()} MB, plus browser and working memory. ` : ''}Load your chosen model before running a check. This button does not download or switch models.`, 'mg-improvement-muted');
  const checkError = errorRegion();
  const checkActions = row(actionButton('Run check', () => onEvaluate(currentModel), checkError, { primary: true, disabled: busy || !currentModel || typeof onEvaluate !== 'function' }), actionButton('Clear check history', onClearRuns, checkError, { disabled: busy || !runs.length }));
  if (busy && typeof onCancel === 'function') checkActions.append(actionButton('Stop check', onCancel, checkError));
  checks.append(modelField, modelInfo, checkActions, checkError);
  if (busy || progress) {
    const status = el('p', progress || 'Checking the current model…', 'mg-improvement-progress');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    checks.append(status);
  }
  if (!runs.length) checks.append(el('p', 'No checks have run yet. Your first run will appear here with its answers and criteria.', 'mg-improvement-empty'));
  for (const run of runs.slice(-5).reverse()) {
    const cases = Array.isArray(run.cases) ? run.cases : [];
    const passed = cases.filter(item => item.passed === true).length;
    const total = Number.isSafeInteger(run.total) && run.total >= 0 ? run.total : cases.length;
    const completed = Number.isSafeInteger(run.completed) && run.completed >= 0 ? Math.min(run.completed, total) : cases.length;
    const entry = el('article', '', 'mg-improvement-run');
    entry.dataset.runId = String(run.id || '');
    entry.append(row(el('h4', modelLabel(run.model)), badge(`${passed} criteria passed · ${completed}/${total} checked`, 'neutral')));
    const duration = Number(run.durationMs);
    entry.append(el('p', `${readableTime(run.time)} · ${run.suite||'maxg-local-checks-v1'}${Number.isFinite(duration) && duration >= 0 ? ` · ${(duration / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} seconds` : ''}`, 'mg-improvement-muted'));
    for (const item of cases) {
      const result = el('details', '', 'mg-improvement-case');
      const summary = el('summary');
      summary.append(el('span', item.title || item.id || 'Criterion'), badge(item.passed === true ? 'Passed' : item.passed === false ? 'Needs attention' : 'Not scored', item.passed === true ? 'positive' : 'neutral'));
      result.append(summary, el('p', `Criterion: ${item.criterion || 'No criterion was recorded.'}`, 'mg-improvement-muted'), el('pre', item.answer || 'No answer recorded.', 'mg-improvement-copy'));
      entry.append(result);
    }
    checks.append(entry);
  }
  panel.append(checks);

  const lessonCard = section('Reviewed reference lessons', 'Enabled lessons may provide context for relevant chat replies when saved memory is on. Disabled lessons stay out of the prompt. Tool access stays under your permission settings.');
  const manualField = el('label', '', 'mg-improvement-field');
  const manual = el('textarea');
  manual.rows = 3;
  manual.maxLength = 1200;
  manual.placeholder = 'For example: I prefer a concrete example when learning a new programming term.';
  manualField.append(el('span', 'New reference lesson to review'), manual);
  const lessonError = errorRegion();
  lessonCard.append(manualField, row(actionButton('Save as disabled lesson', () => {
    const text = manual.value.trim();
    if (!text) throw new Error('Write a reference lesson before saving it.');
    return onSaveManualLesson(text);
  }, lessonError, { disabled: typeof onSaveManualLesson !== 'function' })), lessonError);
  if (!lessons.length) lessonCard.append(el('p', 'No lessons saved. Add a reference lesson or turn a feedback correction into one for review.', 'mg-improvement-empty'));
  for (const lesson of [...lessons].reverse()) {
    const item = el('article', '', 'mg-improvement-lesson');
    item.dataset.lessonId = String(lesson.id || '');
    const enabled = lesson.enabled === true;
    const source = { feedback: 'From feedback', manual: 'Manual reference lesson', study: 'From study notes' }[lesson.source?.kind] || 'Saved reference lesson';
    item.append(row(el('h4', lesson.title || source), badge(enabled ? 'Enabled' : 'Disabled', enabled ? 'positive' : 'neutral')), el('p', lesson.text || 'No lesson text recorded.', 'mg-improvement-lesson-text'));
    if (lesson.time) item.append(el('p', readableTime(lesson.time), 'mg-improvement-muted'));
    const error = errorRegion();
    item.append(row(actionButton(enabled ? 'Disable lesson' : 'Review & enable lesson', () => onApplyLesson(lesson.id, !enabled), error, { disabled: typeof onApplyLesson !== 'function' }), actionButton('Delete lesson', () => onDeleteLesson(lesson.id), error, { danger: true, disabled: typeof onDeleteLesson !== 'function' })), error);
    lessonCard.append(item);
  }
  panel.append(lessonCard);

  const feedbackCard = section('Recent feedback', 'Corrections are suggestions until you choose to stage and review a lesson. Clearing feedback removes its ratings, corrections and saved excerpts; lessons remain separately managed above.');
  const feedbackError = errorRegion();
  feedbackCard.append(row(actionButton('Clear saved feedback', onClearFeedback, feedbackError, { disabled: !feedback.length })), feedbackError);
  if (!feedback.length) feedbackCard.append(el('p', 'Use Helpful or Needs work below a MAX-G reply to leave feedback.', 'mg-improvement-empty'));
  for (const item of feedback.slice(-8).reverse()) {
    const entry = el('article', '', 'mg-improvement-feedback');
    entry.dataset.feedbackId = String(item.id || '');
    entry.append(row(badge(item.rating === 'helpful' ? 'Helpful' : item.rating === 'needs_work' ? 'Needs work' : 'Rating unavailable', item.rating === 'helpful' ? 'positive' : 'neutral'), el('span', readableTime(item.time), 'mg-improvement-muted')));
    if (item.model) entry.append(el('p', modelLabel(item.model), 'mg-improvement-muted'));
    if (item.question) entry.append(disclosure('Question', item.question));
    if (item.answer) entry.append(disclosure('MAX-G’s answer', item.answer));
    if (item.correction) {
      entry.append(el('p', 'Your correction', 'mg-improvement-label'), el('p', item.correction, 'mg-improvement-lesson-text'));
      const error = errorRegion();
      entry.append(row(actionButton('Stage correction as a disabled lesson', () => onStageLesson(item.id), error, { disabled: typeof onStageLesson !== 'function' })), error);
    } else entry.append(el('p', 'No correction added.', 'mg-improvement-muted'));
    feedbackCard.append(entry);
  }
  panel.append(feedbackCard);
  return panel;
}

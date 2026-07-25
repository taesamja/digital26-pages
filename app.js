const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/* Number converter */
const baseNames = { 2: '2 진수', 8: '8 진수', 10: '10 진수', 16: '16 진수', ascii: 'ASCII' };
const baseDefaults = { 2: '101101', 8: '55', 10: '45', 16: '2D', ascii: 'A' };
const patterns = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[\da-f]+$/i };
let activeBase = '2';

function parseInput(value, base) {
  const clean = value.trim();
  if (!clean) return null;
  if (base === 'ascii') return BigInt(clean.codePointAt(0));
  if (!patterns[base].test(clean)) throw new Error(`${baseNames[base]}에 맞는 값을 입력하세요.`);
  if (base === '10') return BigInt(clean);

  let total = 0n;
  const radix = BigInt(base);
  for (const digit of clean.toUpperCase()) total = total * radix + BigInt(parseInt(digit, Number(base)));
  return total;
}

function formatValue(value, base) {
  return value.toString(Number(base)).toUpperCase();
}

function renderConversion() {
  const input = $('#convertInput').value;
  const error = $('#convertError');
  try {
    const value = parseInput(input, activeBase);
    error.textContent = '';
    if (value === null) {
      $('#convertResults').innerHTML = '';
      $('#conversionSteps').innerHTML = '<p>값을 입력하면 계산 과정이 표시됩니다.</p>';
      return;
    }

    $('#convertResults').innerHTML = [2, 8, 10, 16].map((base) => `
      <div class="result-item"><span>${baseNames[base]}</span><strong title="${formatValue(value, base)}">${formatValue(value, base)}</strong></div>
    `).join('');
    renderConversionSteps(input, value);
  } catch (exception) {
    error.textContent = exception.message;
    $('#convertResults').innerHTML = '';
    $('#conversionSteps').innerHTML = '<p>입력 형식을 확인해주세요.</p>';
  }
}

function renderConversionSteps(input, decimal) {
  const clean = input.trim().toUpperCase();
  if (activeBase === 'ascii') {
    $('#conversionSteps').innerHTML = `
      <p>문자 <span class="formula">${clean[0]}</span>의 유니코드 값</p>
      <p class="formula">codePointAt(0) = ${decimal}</p>
      <p>2 진수 표현 = <strong>${decimal.toString(2)}</strong></p>`;
    return;
  }
  if (activeBase === '10') {
    $('#conversionSteps').innerHTML = `
      <p>10 진수 <span class="formula">${decimal}</span>을 각 진법으로 나눈 나머지를 역순으로 배열합니다.</p>
      <p>2 진수 = <strong>${decimal.toString(2)}</strong></p>
      <p>8 진수 = ${decimal.toString(8)}</p><p>16 진수 = ${decimal.toString(16).toUpperCase()}</p>`;
    return;
  }

  const radix = Number(activeBase);
  if (clean.length > 14) {
    $('#conversionSteps').innerHTML = `<p>각 자릿수에 ${radix}의 거듭제곱을 곱해 더합니다.</p><p>10 진수 결과 = <strong>${decimal}</strong></p>`;
    return;
  }
  const terms = [...clean].map((digit, index) => {
    const power = clean.length - index - 1;
    return `${digit}×${radix}<sup>${power}</sup>`;
  });
  $('#conversionSteps').innerHTML = `
    <p>${baseNames[activeBase]}의 자릿값을 펼치면</p>
    <p class="formula">${terms.join(' + ')}</p>
    <p>= <strong>${decimal}</strong> (10 진수)</p>`;
}

$$('.base-tabs button').forEach((button) => button.addEventListener('click', () => {
  $$('.base-tabs button').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  activeBase = button.dataset.base;
  $('#convertLabel').textContent = `${baseNames[activeBase]} 입력`;
  $('#convertInput').value = baseDefaults[activeBase];
  renderConversion();
}));
$('#convertInput').addEventListener('input', renderConversion);
$('#clearConvert').addEventListener('click', () => { $('#convertInput').value = ''; renderConversion(); $('#convertInput').focus(); });

/* Logic gates */
const gateFunctions = {
  AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: (a) => a ? 0 : 1,
  NAND: (a, b) => (a & b) ? 0 : 1, NOR: (a, b) => (a | b) ? 0 : 1,
  XOR: (a, b) => a ^ b, XNOR: (a, b) => (a ^ b) ? 0 : 1,
};
const gateBodies = {
  AND: { body: 'M80,50 L135,50 A50,50 0 0 1 135,150 L80,150 Z' },
  NAND: { body: 'M80,50 L135,50 A50,50 0 0 1 135,150 L80,150 Z', bubble: true },
  OR: { body: 'M72,50 Q132,50 200,100 Q132,150 72,150 Q102,100 72,50 Z', or: true },
  NOR: { body: 'M72,50 Q132,50 200,100 Q132,150 72,150 Q102,100 72,50 Z', or: true, bubble: true },
  XOR: { body: 'M84,50 Q144,50 212,100 Q144,150 84,150 Q114,100 84,50 Z', or: true, xor: true },
  XNOR: { body: 'M84,50 Q144,50 212,100 Q144,150 84,150 Q114,100 84,50 Z', or: true, xor: true, bubble: true },
  NOT: { body: 'M80,50 L80,150 L200,100 Z', not: true, bubble: true },
};

function pin(x, y, value) {
  const unknown = value === '?';
  const fill = unknown ? '#34425c' : value ? '#3578f6' : '#1c2941';
  return `<circle cx="${x}" cy="${y}" r="11" fill="${fill}" stroke="#7891ba" stroke-width="1.5"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#fff" font-size="12" font-weight="800">${value}</text>`;
}

function gateMarkup(gate, a, b, unknownOutput = false) {
  const config = gateBodies[gate];
  const unary = gate === 'NOT';
  const y = unary ? gateFunctions[gate](a) : gateFunctions[gate](a, b);
  const tip = config.not ? 200 : config.xor ? 212 : config.or ? 200 : 185;
  const bubbleX = tip + 9;
  const outputStart = config.bubble ? tip + 18 : tip;
  const inputX = config.xor ? 72 : config.or ? 78 : 80;
  const inputs = unary
    ? `<line x1="20" y1="100" x2="80" y2="100" stroke="${a ? '#6da2ff' : '#536783'}" stroke-width="3"/>${pin(20, 100, a)}<text x="12" y="88" fill="#91a0ba" font-size="11">A</text>`
    : `<line x1="20" y1="70" x2="${inputX}" y2="70" stroke="${a ? '#6da2ff' : '#536783'}" stroke-width="3"/><line x1="20" y1="130" x2="${inputX}" y2="130" stroke="${b ? '#6da2ff' : '#536783'}" stroke-width="3"/>${pin(20, 70, a)}${pin(20, 130, b)}<text x="12" y="57" fill="#91a0ba" font-size="11">A</text><text x="12" y="117" fill="#91a0ba" font-size="11">B</text>`;
  const extra = config.xor ? '<path d="M70,50 Q100,100 70,150" fill="none" stroke="#6da2ff" stroke-width="3"/>' : '';
  const bubble = config.bubble ? `<circle cx="${bubbleX}" cy="100" r="9" fill="#0d172a" stroke="#6da2ff" stroke-width="3"/>` : '';
  const output = unknownOutput ? '?' : y;
  return `${inputs}<path d="${config.body}" fill="rgba(53,120,246,.13)" stroke="#6da2ff" stroke-width="3" stroke-linejoin="round"/>${extra}${bubble}<line x1="${outputStart}" y1="100" x2="295" y2="100" stroke="${unknownOutput || !y ? '#536783' : '#6da2ff'}" stroke-width="3"/>${pin(295, 100, output)}<text x="300" y="88" fill="#91a0ba" font-size="11">Y</text><text x="${config.or ? 126 : 120}" y="105" text-anchor="middle" fill="#b8d0ff" font-size="15" font-weight="800">${gate}</text>`;
}

function updateGate() {
  const gate = $('#gateSelect').value;
  const a = $('#inputA').checked ? 1 : 0;
  const b = $('#inputB').checked ? 1 : 0;
  const unary = gate === 'NOT';
  const y = unary ? gateFunctions[gate](a) : gateFunctions[gate](a, b);
  $('#inputBRow').style.display = unary ? 'none' : 'flex';
  $('#gateOutput').textContent = y;
  $('#gateSvg').innerHTML = gateMarkup(gate, a, b);
  renderTruthTable(gate, a, b);
}

function renderTruthTable(gate, currentA, currentB) {
  const unary = gate === 'NOT';
  let html = unary ? '<tr><th>A</th><th>Y</th></tr>' : '<tr><th>A</th><th>B</th><th>Y</th></tr>';
  for (let a = 0; a <= 1; a++) {
    if (unary) {
      html += `<tr class="${a === currentA ? 'current' : ''}"><td>${a}</td><td>${gateFunctions[gate](a)}</td></tr>`;
    } else {
      for (let b = 0; b <= 1; b++) {
        html += `<tr class="${a === currentA && b === currentB ? 'current' : ''}"><td>${a}</td><td>${b}</td><td>${gateFunctions[gate](a, b)}</td></tr>`;
      }
    }
  }
  $('#truthTable').innerHTML = html;
}
$('#gateSelect').addEventListener('change', updateGate);
$('#inputA').addEventListener('change', updateGate);
$('#inputB').addEventListener('change', updateGate);

/* Browser-only quiz */
const booleanQuestions = [
  ['불 대수에서 <b>A + 0</b>은?', 'A', ['A', '0', '1', "A'"], '항등 법칙'],
  ['불 대수에서 <b>A · 1</b>은?', 'A', ['A', '0', '1', "A'"], '항등 법칙'],
  ['불 대수에서 <b>A + 1</b>은?', '1', ['A', '0', '1', "A'"], '지배 법칙'],
  ['불 대수에서 <b>A · 0</b>은?', '0', ['A', '0', '1', "A'"], '지배 법칙'],
  ["<b>A + A'</b>의 결과는?", '1', ['A', '0', '1', "A'"], '보수 법칙'],
  ["<b>(A · B)'</b>와 같은 식은?", "A' + B'", ["A' + B'", "A' · B'", 'A + B', 'A · B'], '드모르간'],
];
let currentQuestion;
let questionStartedAt = 0;
let answered = false;

function baseQuestion() {
  const type = pick(['bin-dec', 'oct-dec', 'dec-bin', 'dec-oct', 'hex-dec', 'dec-hex']);
  const decimal = random(5, 255);
  const source = type.startsWith('bin') ? decimal.toString(2) : type.startsWith('oct') ? decimal.toString(8) : type.startsWith('hex') ? decimal.toString(16).toUpperCase() : String(decimal);
  const target = type.endsWith('bin') ? decimal.toString(2) : type.endsWith('oct') ? decimal.toString(8) : type.endsWith('hex') ? decimal.toString(16).toUpperCase() : String(decimal);
  const sourceBase = type.startsWith('bin') ? 2 : type.startsWith('oct') ? 8 : type.startsWith('hex') ? 16 : 10;
  const targetBase = type.endsWith('bin') ? 2 : type.endsWith('oct') ? 8 : type.endsWith('hex') ? 16 : 10;
  const candidates = [target];
  for (const offset of [1, -1, 2, 8, 16]) {
    const value = Math.max(0, decimal + offset).toString(targetBase).toUpperCase();
    if (!candidates.includes(value)) candidates.push(value);
    if (candidates.length === 4) break;
  }
  return { category: '진법 변환', topic: `${sourceBase}→${targetBase}`, html: `<b>${source}</b> (${sourceBase} 진수)를 ${targetBase} 진수로 변환하면?`, answer: target, choices: shuffle(candidates) };
}

function logicQuestion() {
  const gate = pick(Object.keys(gateFunctions));
  const a = random(0, 1), b = random(0, 1);
  const answer = String(gate === 'NOT' ? gateFunctions[gate](a) : gateFunctions[gate](a, b));
  return { category: '논리 게이트', topic: gate, html: `그림의 입력에서 출력 Y는?`, answer, choices: ['0', '1'], visual: { gate, a, b } };
}

function booleanQuestion() {
  const [html, answer, choices, topic] = pick(booleanQuestions);
  return { category: '불 대수', topic, html, answer, choices: shuffle(choices) };
}

function createQuestion() {
  const selected = $('#quizCategory').value;
  const category = selected || pick(['진법 변환', '논리 게이트', '불 대수']);
  return category === '진법 변환' ? baseQuestion() : category === '논리 게이트' ? logicQuestion() : booleanQuestion();
}

function loadQuestion() {
  currentQuestion = createQuestion();
  answered = false;
  questionStartedAt = Date.now();
  $('#quizCategoryLabel').textContent = currentQuestion.category;
  $('#quizTopicLabel').textContent = currentQuestion.topic;
  $('#quizFeedback').textContent = '';
  $('#quizFeedback').className = '';
  $('#nextQuiz').style.display = 'none';
  const visual = currentQuestion.visual
    ? `<div class="quiz-gate"><svg viewBox="0 0 320 180">${gateMarkup(currentQuestion.visual.gate, currentQuestion.visual.a, currentQuestion.visual.b, true)}</svg></div>`
    : '';
  $('#quizQuestion').innerHTML = visual + currentQuestion.html;
  $('#quizChoices').innerHTML = '';
  currentQuestion.choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'choice';
    button.textContent = choice;
    button.addEventListener('click', () => answerQuestion(choice, button));
    $('#quizChoices').append(button);
  });
}

function answerQuestion(choice, selectedButton) {
  if (answered) return;
  answered = true;
  const correct = String(choice) === String(currentQuestion.answer);
  $$('.choice').forEach((button) => {
    button.disabled = true;
    if (button.textContent === String(currentQuestion.answer)) button.classList.add('correct');
    else if (button === selectedButton) button.classList.add('wrong');
  });
  $('#quizFeedback').textContent = correct ? '정답입니다. 잘했어요!' : `정답은 ${currentQuestion.answer}입니다.`;
  $('#quizFeedback').className = correct ? 'success' : 'fail';
  $('#nextQuiz').style.display = 'block';
  saveAttempt({ category: currentQuestion.category, topic: currentQuestion.topic, correct, seconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)), at: Date.now() });
}
$('#nextQuiz').addEventListener('click', loadQuestion);
$('#quizCategory').addEventListener('change', loadQuestion);

/* Local analytics */
const storageKey = 'logic-lab-attempts-v1';
let attempts = loadAttempts();

function loadAttempts() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function saveAttempt(attempt) {
  attempts.push(attempt);
  attempts = attempts.slice(-500);
  try { localStorage.setItem(storageKey, JSON.stringify(attempts)); } catch { /* Storage can be blocked in private mode. */ }
  renderAnalytics();
}

function renderAnalytics() {
  const total = attempts.length;
  const correct = attempts.filter((item) => item.correct).length;
  const accuracy = total ? Math.round(correct / total * 100) : 0;
  const average = total ? Math.round(attempts.reduce((sum, item) => sum + item.seconds, 0) / total) : 0;
  $('#statAccuracy').innerHTML = `${accuracy}<small>%</small>`;
  $('#statTotal').innerHTML = `${total}<small>문제</small>`;
  $('#statTime').innerHTML = `${average}<small>초</small>`;
  $('#statBadges').innerHTML = `${Math.floor(correct / 10)}<small>개</small>`;

  const categories = ['진법 변환', '논리 게이트', '불 대수'];
  $('#categoryBars').innerHTML = categories.map((category) => {
    const items = attempts.filter((item) => item.category === category);
    const rate = items.length ? Math.round(items.filter((item) => item.correct).length / items.length * 100) : 0;
    return `<div class="category-row"><div class="category-label"><span>${category}</span><strong>${rate}% · ${items.length}문제</strong></div><div class="bar-track"><div class="bar-fill" style="width:${rate}%"></div></div></div>`;
  }).join('');

  const recent = attempts.slice(-5).reverse();
  $('#recentList').innerHTML = recent.length ? recent.map((item) => `
    <div class="recent-item"><span class="recent-mark ${item.correct ? 'ok' : 'no'}">${item.correct ? '✓' : '×'}</span><div><span>${item.category}</span><small>${item.topic}</small></div><small>${item.seconds}초</small></div>
  `).join('') : '<p class="empty-state">문제를 풀면 최근 기록이 표시됩니다.</p>';
}

$('#resetData').addEventListener('click', () => {
  if (!confirm('이 브라우저의 학습 기록을 모두 삭제할까요?')) return;
  attempts = [];
  localStorage.removeItem(storageKey);
  renderAnalytics();
});

/* AI tutor via Vercel Serverless Function */
const aiApiUrl = (window.APP_CONFIG?.AI_API_URL || '').replace(/\/$/, '');
const chatHistory = [];
const aiStatus = $('#aiStatus');

if (aiApiUrl) {
  aiStatus.textContent = 'AI API 연결 준비';
  aiStatus.classList.add('ready');
} else {
  aiStatus.textContent = 'Vercel API 설정 필요';
  aiStatus.classList.add('setup');
}

function escapeMarkdownHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(markdown) {
  const codeBlocks = [];
  const inlineCodes = [];
  let source = String(markdown).replace(/(```|''')(\w*)[^\S\r\n]*\r?\n?([\s\S]*?)\1/g, (_, fence, language, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre class="md-pre"><code>${escapeMarkdownHtml(code.replace(/\r?\n$/, ''))}</code></pre>`);
    return `\u0000CODE${index}\u0000`;
  });

  source = source.replace(/`([^`\n]+)`/g, (_, code) => {
    const index = inlineCodes.length;
    inlineCodes.push(`<code class="md-code">${escapeMarkdownHtml(code)}</code>`);
    return `\u0000INLINE${index}\u0000`;
  });
  source = escapeMarkdownHtml(source);

  const output = [];
  let listType = null;
  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };
  const inline = (text) => text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    const unordered = line.match(/^\s*[-*+]\s+(.*)$/);

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      closeList();
      output.push('<hr class="md-hr">');
    } else if (heading) {
      closeList();
      output.push(`<div class="md-heading md-heading-${heading[1].length}">${inline(heading[2])}</div>`);
    } else if (ordered) {
      if (listType !== 'ol') { closeList(); output.push('<ol class="md-list">'); listType = 'ol'; }
      output.push(`<li>${inline(ordered[1])}</li>`);
    } else if (unordered) {
      if (listType !== 'ul') { closeList(); output.push('<ul class="md-list">'); listType = 'ul'; }
      output.push(`<li>${inline(unordered[1])}</li>`);
    } else if (/^\u0000CODE\d+\u0000$/.test(line.trim())) {
      closeList();
      output.push(line.trim());
    } else if (!line.trim()) {
      closeList();
    } else {
      closeList();
      output.push(`<p class="md-paragraph">${inline(line)}</p>`);
    }
  }
  closeList();

  return output.join('')
    .replace(/\u0000INLINE(\d+)\u0000/g, (_, index) => inlineCodes[index])
    .replace(/\u0000CODE(\d+)\u0000/g, (_, index) => codeBlocks[index]);
}

function addChatMessage(text, sender, markdown = false) {
  const row = document.createElement('div');
  row.className = `chat-row ${sender}`;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  if (markdown && sender === 'bot') {
    bubble.classList.add('markdown');
    bubble.innerHTML = renderMarkdown(text);
  } else {
    bubble.textContent = text;
  }
  if (sender === 'bot') {
    const avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.textContent = '🤖';
    row.append(avatar);
  }
  row.append(bubble);
  $('#chatBox').append(row);
  $('#chatBox').scrollTop = $('#chatBox').scrollHeight;
  return row;
}

function setChatBusy(busy) {
  $('#chatInput').disabled = busy;
  $('#chatSend').disabled = busy;
  $('#chatSend').textContent = busy ? '응답 중...' : '보내기';
}

async function sendChat(message) {
  const question = message.trim();
  if (!question) return;
  addChatMessage(question, 'user');
  $('#chatInput').value = '';

  if (!aiApiUrl) {
    addChatMessage('Vercel API 주소가 설정되지 않았습니다. config.js에 Vercel API 주소를 입력해주세요.', 'bot');
    return;
  }

  const previousHistory = chatHistory.slice(-6);
  chatHistory.push({ role: 'user', content: question });
  setChatBusy(true);
  const typing = addChatMessage('답변을 작성하고 있어요...', 'bot');

  try {
    const response = await fetch(`${aiApiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question, history: previousHistory })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI 응답을 불러오지 못했습니다.');
    typing.remove();
    addChatMessage(data.reply, 'bot', true);
    chatHistory.push({ role: 'assistant', content: data.reply });
    aiStatus.textContent = 'AI 연결됨';
    aiStatus.className = 'ai-status connected';
  } catch (error) {
    typing.remove();
    addChatMessage(error.message || 'AI 서버에 연결할 수 없습니다.', 'bot');
    aiStatus.textContent = '연결 오류';
    aiStatus.className = 'ai-status error';
  } finally {
    setChatBusy(false);
    $('#chatInput').focus();
  }
}

$('#chatForm').addEventListener('submit', (event) => {
  event.preventDefault();
  sendChat($('#chatInput').value);
});
$$('.quick-questions button').forEach((button) => button.addEventListener('click', () => {
  $('#chatInput').value = button.dataset.question;
  $('#chatForm').requestSubmit();
}));

/* Navigation */
const navLinks = $$('.nav a');
const navigationSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
let preferredSection = 'converter';
let navigationFrame;

function activateNavigation(sectionId) {
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
  });
}

function syncNavigationToScroll() {
  navigationFrame = null;
  const focusY = window.innerHeight * 0.35;
  const candidates = navigationSections
    .map((section, index) => {
      const rect = section.getBoundingClientRect();
      const visible = rect.bottom > 70 && rect.top < window.innerHeight;
      const distance = rect.top <= focusY && rect.bottom >= focusY
        ? 0
        : Math.min(Math.abs(rect.top - focusY), Math.abs(rect.bottom - focusY));
      return { section, index, visible, distance };
    })
    .filter((item) => item.visible)
    .sort((a, b) => a.distance - b.distance || a.index - b.index);

  if (!candidates.length) return;
  const bestDistance = candidates[0].distance;
  const tied = candidates.filter((item) => Math.abs(item.distance - bestDistance) < 2);
  const selected = tied.find((item) => item.section.id === preferredSection) || tied[0];
  preferredSection = selected.section.id;
  activateNavigation(preferredSection);
}

navLinks.forEach((link) => link.addEventListener('click', () => {
  preferredSection = link.getAttribute('href').slice(1);
  activateNavigation(preferredSection);
}));

$('.banner-button').addEventListener('click', () => {
  preferredSection = 'quiz';
  activateNavigation(preferredSection);
});

window.addEventListener('scroll', () => {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(syncNavigationToScroll);
}, { passive: true });
window.addEventListener('resize', syncNavigationToScroll);
syncNavigationToScroll();

renderConversion();
updateGate();
loadQuestion();
renderAnalytics();

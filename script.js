const priorOperationDiv = document.querySelector('#prior-operation');
const currentEntryDiv = document.querySelector('#current-entry');

const numberBtns = document.querySelectorAll('.number-btn');
const binaryOpBtns = document.querySelectorAll('.bi-op');
const unaryOpBtns = document.querySelectorAll('.uni-op');

const backBtn = document.querySelector('#back-btn');
const clearEntryBtn = document.querySelector('#clear-entry-btn');
const clearAllBtn = document.querySelector('#clear-all-btn');
const negateBtn = document.querySelector('#negate-btn');
const equalsBtn = document.querySelector('#equals-btn');

const allBtns = document.querySelectorAll('.btn');
const shortcutsLink = document.querySelector('#shortcuts-link');

const entryLimit = 8;

let isNegative = false;
let numDecimalPoints = 0;
let digitsStack = ['0'];
let evaluation = 0;

let priorNumber = 0;
let priorOp = '';

let unaryOpStack = [];
let valueOnDisplay = '0';

const FINAL_RESULT_STATE = 0
const NUMBER_ENTRY_STATE = 1;
const BINARY_OP_STATE = 2;
const UNARY_OP_STATE = 3;

let state = NUMBER_ENTRY_STATE;

function roundNumber(num) {
    const precision = 7;
    let precision2 = precision;
    let absNum = Math.abs(num);
    if (absNum >= 10) precision2 -= Math.floor(Math.log10(absNum));
    const factor = 10**precision2;
    num = Math.round((num + Number.EPSILON)*factor) / factor;
    if (precision2 < 0) num = num.toPrecision(precision + 1);
    return num;
}

function evaluateUnaryOp(num, op) {
    switch (op) {
        case 'neg':
            return -num;
        case 'sqrt':
            return Math.sqrt(num);
        case 'square':
            return num ** 2;
        case '1/':
            return 1 / num;
        default:
            return num;
    }
}

function digitsStackToStr() {
    const negSign = isNegative ? '-' : '';
    return negSign + digitsStack.join('');
}

function digitsStackToNum() {
    return Number(digitsStackToStr());
}

function unaryOpStackToStr() {
    const tokensToShow = unaryOpStack.map(x => (x + '( ')).reverse();
    tokensToShow.push(digitsStackToNum());
    tokensToShow.push(' )'.repeat(unaryOpStack.length));
    return tokensToShow.join('');
}

function unaryOpStackToNum() {
    return unaryOpStack.reduce(evaluateUnaryOp, digitsStackToNum());
}

function displayDigits() {
    switch(state) {
        case FINAL_RESULT_STATE:
            valueOnDisplay = roundNumber(evaluation);
            break;
        case NUMBER_ENTRY_STATE:
            valueOnDisplay = digitsStackToStr();
            break;
        case BINARY_OP_STATE:
            valueOnDisplay = roundNumber(priorNumber);
            break;
        case UNARY_OP_STATE:
            valueOnDisplay = roundNumber(unaryOpStackToNum());
            break;
    }
    currentEntryDiv.textContent = valueOnDisplay;
}

function isDisplayingZero() {
    return digitsStack.length === 1 && digitsStack[0] === '0';
}

function updateNumberEntry(val) {
    switch (state) {
        case BINARY_OP_STATE:
        case UNARY_OP_STATE:
            clearEntry();
            break;
        case FINAL_RESULT_STATE:
            clearAll();
            break;
    }
    if (digitsStack.length - numDecimalPoints === entryLimit) return;
    if (val === '0' && isDisplayingZero()) return;

    if (val === '.') {
        if (numDecimalPoints) return;
        numDecimalPoints++;
    } else if (isDisplayingZero()) {
        digitsStack.pop();
    }
    digitsStack.push(val);
}

function removeEntry() {
    if (state !== NUMBER_ENTRY_STATE) return;
    const val = digitsStack.pop();
    if (val === '.') numDecimalPoints--;
    if (digitsStack.length === 0) digitsStack.push('0');
    if (isDisplayingZero()) isNegative = false;
}

function negate() {
    if (state !== NUMBER_ENTRY_STATE) return;
    if (isDisplayingZero()) return;
    isNegative = !isNegative;
}

function clearEntry() {
    state = NUMBER_ENTRY_STATE;
    digitsStack = ['0'];
    isNegative = false;
    numDecimalPoints = 0;
    unaryOpStack = [];
}

function clearAll() {
    clearEntry();
    priorOp = '';
}

function clearEntryBtnBehaviour() {
    if (state === FINAL_RESULT_STATE) clearAll();
    else clearEntry();
}

function convertOpToDisplayChar(op) {
    if (op === '%') return 'mod';
    else if (op === '/') return '÷';
    else if (op === '*') return '×';
    else return op;
}

function displayQuery() {
    let part1 = '';
    if (priorOp !== '') {
        const priorNumberRounded = roundNumber(priorNumber);
        const opToShow = convertOpToDisplayChar(priorOp);
        part1 = `${priorNumberRounded} ${opToShow} `
    }
    let part2 = '';
    if (state === FINAL_RESULT_STATE) {
        const num = unaryOpStackToStr();
        part2 = `${num} =`;
    }
    if (state === UNARY_OP_STATE) {
        part2 = unaryOpStackToStr();
    }
    const queryText = part1 + part2;
    priorOperationDiv.innerHTML = (queryText === '' ? '<br>' : queryText);
}

function evaluate() {
    const num = unaryOpStackToNum();
    const properMod = function (a, b) {
        return ((a % b) + b) % b;
    };
    let result = undefined;
    switch(priorOp) {
        case '':
            result = num;
            break;
        case '%':
            if (num === 0) {
                alert("Cannot mod by 0");
                return undefined;
            }
            result = properMod(priorNumber, num);
            break;
        case '/':
            if (num === 0) {
                alert("Cannot divide by 0");
                return undefined;
            }
            result = priorNumber / num;
            break;
        case '*':
            result = priorNumber * num;
            break;
        case '-':
            result = priorNumber - num;
            break;
        case '+':
            result = priorNumber + num;
            break;
    }
    evaluation = result;
    return result;
}

function addOperation(op) {
    switch (state) {
        case NUMBER_ENTRY_STATE:
        case UNARY_OP_STATE:
            let result = evaluate();
            if (result === undefined) return;
            priorNumber = result;
            break;
        case FINAL_RESULT_STATE:
            priorNumber = evaluation;
            break;
    }
    priorOp = op;
    state = BINARY_OP_STATE;
}

function setToEquation() {
    if (state === BINARY_OP_STATE) {
        isNegative = false;
        digitsStack = [valueOnDisplay];
        unaryOpStack = []
    }
    let result = evaluate();
    if (result === undefined) return;
    state = FINAL_RESULT_STATE;
}

function applyUnaryOp(op) {
    if (op === 'sqrt' && valueOnDisplay < 0) {
        alert('Cannot square root a negative number');
        return;
    }
    if (op === '1/' && valueOnDisplay == 0) {
        alert('Cannot take reciprocal of 0');
        return;
    }
    switch (state) {
        case NUMBER_ENTRY_STATE:
            if (op === 'neg') return;
            break;
        case FINAL_RESULT_STATE:
            clearAll();
        case BINARY_OP_STATE:
            isNegative = false;
            digitsStack = [valueOnDisplay];
            break;
    }
    state = UNARY_OP_STATE;
    unaryOpStack.push(op);
}

function showShortcuts() {
    window.open('shortcuts/index.html', '_blank', 'height=700,width=700').focus();
}

function handleKeyPress(event) {
    const key = event.key;
    if (key >= 0 && key <= 9 || key === '.') updateNumberEntry(key);
    else if (key === 'n') {
        negate();
        applyUnaryOp('neg');
    }
    else if (key === 'Backspace') removeEntry();
    else if (key === 'Delete') clearEntryBtnBehaviour();
    else if (key === 'Escape') clearAll();
    else if (key === '%' || key === '/' || key === '*' || key === '-' || key === '+') addOperation(key);
    else if (key === '=' || key === 'Enter') setToEquation();
    else if (key === 'r') applyUnaryOp('1/');
    else if (key === 'q') applyUnaryOp('square');
    else if (key === 'w') applyUnaryOp('sqrt');
    else {
        if (key === 'h') showShortcuts();
        return;
    }
    displayQuery();
    displayDigits();
}

numberBtns.forEach(btn => btn.addEventListener('click', () => updateNumberEntry(btn.value)));
backBtn.addEventListener('click', removeEntry);
negateBtn.addEventListener('click', negate);

clearEntryBtn.addEventListener('click', clearEntryBtnBehaviour);
clearAllBtn.addEventListener('click', clearAll);

binaryOpBtns.forEach(btn => btn.addEventListener('click', () => addOperation(btn.value)));
equalsBtn.addEventListener('click', setToEquation);

unaryOpBtns.forEach(btn => btn.addEventListener('click', () => applyUnaryOp(btn.value)));

allBtns.forEach(btn => btn.addEventListener('click', displayQuery));
allBtns.forEach(btn => btn.addEventListener('click', displayDigits));

shortcutsLink.addEventListener('click', showShortcuts);
window.addEventListener('keydown', handleKeyPress);

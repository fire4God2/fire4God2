import { LottoEngine } from './engine.js';
import { MyNumberStore } from './store.js';

// Initialize Core Engine
const engine = new LottoEngine();
let currentGeneratedNumbers = null;

// DOM Elements
const ballsContainer = document.getElementById('balls-container');
const btnGenerate = document.getElementById('btn-generate');
const btnSave = document.getElementById('btn-save');
const strategySelect = document.getElementById('strategy');
const savedList = document.getElementById('saved-list');
const savedCountBadge = document.getElementById('saved-count');

function getBallColorClass(number) {
    if (number <= 10) return 'color-yellow';
    if (number <= 20) return 'color-blue';
    if (number <= 30) return 'color-red';
    if (number <= 40) return 'color-gray';
    return 'color-green';
}

function renderBalls(numbers) {
    ballsContainer.innerHTML = '';

    numbers.forEach((num, index) => {
        const ball = document.createElement('div');
        ball.className = `lotto-ball ${getBallColorClass(num)}`;
        ball.textContent = num;
        ballsContainer.appendChild(ball);

        // Staggered pop-in animation
        setTimeout(() => {
            ball.classList.add('show');
        }, index * 100);
    });
}

function renderSavedList() {
    const list = MyNumberStore.getSavedNumbers();
    savedList.innerHTML = '';
    savedCountBadge.textContent = list.length;

    if (list.length === 0) {
        savedList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem;">저장된 번호가 없습니다.</p>';
        return;
    }

    list.forEach(item => {
        const el = document.createElement('div');
        el.className = 'saved-item';

        const setsHtml = item.numbers.map(numSet => {
            const ballsHtml = numSet.map(n =>
                `<div class="mini-ball ${getBallColorClass(n)}">${n}</div>`
            ).join('');
            return `<div class="saved-numbers">${ballsHtml}</div>`;
        }).join('');

        const dateStr = new Date(item.date).toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        el.innerHTML = `
            <div class="saved-header">
                <strong>${item.name}</strong>
                <button class="delete-btn" data-id="${item.id}" aria-label="삭제">🗑️</button>
            </div>
            <div class="saved-date">${dateStr}</div>
            ${setsHtml}
        `;

        savedList.appendChild(el);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            MyNumberStore.deleteEntry(id);
            renderSavedList();
        });
    });
}

btnGenerate.addEventListener('click', () => {
    btnGenerate.disabled = true;
    const originalText = btnGenerate.innerHTML;
    btnGenerate.innerHTML = 'AI 알고리즘 연산 중... 🔄';
    ballsContainer.innerHTML = '';

    // Simulate thinking delay for better UX
    setTimeout(() => {
        try {
            const strategy = strategySelect.value;
            const params = strategy === 'metaphysical'
                ? { seed: "user_seed_" + Date.now() }
                : {};

            currentGeneratedNumbers = engine.generate(strategy, params);
            renderBalls(currentGeneratedNumbers);

            btnSave.disabled = false;
        } catch (e) {
            console.error(e);
            alert("조합 생성에 실패했습니다. 내부 필터 제약이 매우 강합니다.");
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = originalText;
        }
    }, 600);
});

btnSave.addEventListener('click', () => {
    if (!currentGeneratedNumbers) return;

    // Parse the name based on the selected option
    const name = strategySelect.options[strategySelect.selectedIndex].text.split(' ')[0] + ' 세트';
    MyNumberStore.saveNumbers(name, [currentGeneratedNumbers]);

    renderSavedList();
    btnSave.disabled = true;
    currentGeneratedNumbers = null;
});

// Init
renderSavedList();

// JS Logic for Mobile AI Lotto

// 1. State & Constants
const STORAGE_KEY = 'ai_lotto_settings_v4';
const ARCHIVE_KEY = 'ai_lotto_archive'; // For saved numbers
const defaultSettings = {
    sumMin: 100,
    sumMax: 170,
    oddEven: '3:3',
    minAc: 7,
    maxConsecutive: 2,
    maxSameColor: 3,
    includes: '',
    excludes: '',
    highLow: 'both',
    zeroZone: '1',
    gap: '20-38',
    prime: '1-3',
    multiple3: '1-3',
    patternGapja: '0',
    carryOver: '0',
    neighborGap: '0'
};

let currentSettings = { ...defaultSettings };
let currentResult = null; // Holds the most recently generated 6 numbers
let latestWinningNumbers = null; // Cache for the latest fetched lotto numbers
let lottoDb = []; // Local JSON DB
let latestDrwNoInfo = null; // Stores {drwNo, date} of the reference draw

function loadArchive() {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? JSON.parse(raw) : [];
}

// 2. DOM Elements
const sumMinEl = document.getElementById('sum-min');
const sumMaxEl = document.getElementById('sum-max');
const sumDisplayEl = document.getElementById('sum-val-display');
const oddEvenEl = document.getElementById('odd-even-select');
const acEl = document.getElementById('ac-value-select');
const consecEl = document.getElementById('consecutive-select');
const colorLimitEl = document.getElementById('color-limit-select');
const includesEl = document.getElementById('include-numbers');
const excludesEl = document.getElementById('exclude-numbers');

const highLowEl = document.getElementById('high-low-select');
const zeroZoneEl = document.getElementById('zero-zone-select');
const gapEl = document.getElementById('gap-select');
const primeEl = document.getElementById('prime-select');
const multiple3El = document.getElementById('multiple3-select');
const patternGapjaEl = document.getElementById('pattern-gapja-select');
const carryOverEl = document.getElementById('carry-over-select');
const neighborEl = document.getElementById('neighbor-select');

const filterPanel = document.getElementById('filter-section');
const btnToggleFilter = document.getElementById('btn-toggle-filters');

const ballsContainer = document.getElementById('balls-display');
const spinner = document.getElementById('loading-spinner');
const infoText = document.getElementById('generation-info');
const btnSave = document.getElementById('btn-save-current');
const savedListEl = document.getElementById('saved-list');
const savedCountEl = document.getElementById('saved-count-badge');

// 3. Initialization & Setting Storage
function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        currentSettings = { ...defaultSettings, ...JSON.parse(saved) };
    }

    sumMinEl.value = currentSettings.sumMin;
    sumMaxEl.value = currentSettings.sumMax;
    oddEvenEl.value = currentSettings.oddEven;
    acEl.value = currentSettings.minAc;
    consecEl.value = currentSettings.maxConsecutive;
    colorLimitEl.value = currentSettings.maxSameColor;
    includesEl.value = currentSettings.includes;
    excludesEl.value = currentSettings.excludes;

    if (highLowEl) highLowEl.value = currentSettings.highLow || 'both';
    if (zeroZoneEl) zeroZoneEl.value = currentSettings.zeroZone || '1';
    if (gapEl) gapEl.value = currentSettings.gap || '20-38';
    if (primeEl) primeEl.value = currentSettings.prime || '1-3';
    if (multiple3El) multiple3El.value = currentSettings.multiple3 || '1-3';
    if (patternGapjaEl) patternGapjaEl.value = currentSettings.patternGapja || '0';
    if (carryOverEl) carryOverEl.value = currentSettings.carryOver || '0';
    if (neighborEl) neighborEl.value = currentSettings.neighborGap || '0';

    updateSumDisplay();
}

function saveSettings() {
    currentSettings = {
        sumMin: parseInt(sumMinEl.value, 10),
        sumMax: parseInt(sumMaxEl.value, 10),
        oddEven: oddEvenEl.value,
        minAc: parseInt(acEl.value, 10),
        maxConsecutive: parseInt(consecEl.value, 10),
        maxSameColor: parseInt(colorLimitEl.value, 10),
        includes: includesEl.value,
        excludes: excludesEl.value,
        highLow: highLowEl ? highLowEl.value : 'both',
        zeroZone: zeroZoneEl ? zeroZoneEl.value : '0',
        gap: gapEl ? gapEl.value : '0',
        prime: primeEl ? primeEl.value : '0',
        multiple3: multiple3El ? multiple3El.value : '0',
        patternGapja: patternGapjaEl ? patternGapjaEl.value : '0',
        carryOver: carryOverEl ? carryOverEl.value : '0',
        neighborGap: neighborEl ? neighborEl.value : '0'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
}

// 4. UI Events
function updateSumDisplay() {
    let min = parseInt(sumMinEl.value, 10);
    let max = parseInt(sumMaxEl.value, 10);
    if (min > max) {
        let temp = min; min = max; max = temp;
        sumMinEl.value = min; sumMaxEl.value = max;
    }
    sumDisplayEl.textContent = `${min} ~ ${max}`;
    saveSettings();
}

sumMinEl.addEventListener('input', updateSumDisplay);
sumMaxEl.addEventListener('input', updateSumDisplay);
oddEvenEl.addEventListener('change', saveSettings);
acEl.addEventListener('change', saveSettings);
consecEl.addEventListener('change', saveSettings);
colorLimitEl.addEventListener('change', saveSettings);
includesEl.addEventListener('change', saveSettings);
excludesEl.addEventListener('change', saveSettings);
if (highLowEl) highLowEl.addEventListener('change', saveSettings);
if (zeroZoneEl) zeroZoneEl.addEventListener('change', saveSettings);
if (gapEl) gapEl.addEventListener('change', saveSettings);
if (primeEl) primeEl.addEventListener('change', saveSettings);
if (multiple3El) multiple3El.addEventListener('change', saveSettings);
if (patternGapjaEl) patternGapjaEl.addEventListener('change', saveSettings);
if (carryOverEl) carryOverEl.addEventListener('change', saveSettings);
if (neighborEl) neighborEl.addEventListener('change', saveSettings);

btnToggleFilter.addEventListener('click', () => { filterPanel.classList.toggle('collapsed'); });

// 5. Shared Render Logic
const getBallColorClass = (num) => {
    if (num <= 10) return 'color-yellow';
    if (num <= 20) return 'color-blue';
    if (num <= 30) return 'color-red';
    if (num <= 40) return 'color-gray';
    return 'color-green';
};

function renderBalls(numbers, source = 'LOCAL') {
    ballsContainer.innerHTML = '';

    if (!numbers || numbers.length !== 6) {
        currentResult = null;
        btnSave.disabled = true;
        ballsContainer.innerHTML = '<div class="empty-text" style="color:#e74c3c;">조합 생성 실패: 필터 조건이 충돌합니다. 완화해 주세요.</div>';
        return;
    }

    currentResult = numbers.sort((a, b) => a - b);
    btnSave.disabled = false; // Enable save mechanism

    currentResult.forEach((num, idx) => {
        const ball = document.createElement('div');
        ball.className = `lotto-ball ${getBallColorClass(num)}`;
        ball.textContent = num;
        ballsContainer.appendChild(ball);

        setTimeout(() => ball.classList.add('show'), idx * 100 + 50);
    });

    let refString = latestDrwNoInfo ? `(기준: 제${latestDrwNoInfo.drwNo}회, ${latestDrwNoInfo.date}) ` : '';

    infoText.textContent = source === 'AI'
        ? `🛸 ${refString}AI (${currentSettings.apiModel}) 가 추천한 행운의 번호입니다.`
        : `🌊 ${refString}오프라인 로컬 스마트 필터 통과 번호입니다.`;
}

function renderArchiveList() {
    const list = loadArchive();
    savedListEl.innerHTML = '';
    savedCountEl.textContent = list.length;

    if (list.length === 0) {
        savedListEl.innerHTML = '<p class="empty-text" style="text-align:center;">저장된 보관 항목이 없습니다.</p>';
        return;
    }

    list.forEach((item) => {
        const dom = document.createElement('div');
        dom.className = 'saved-item';

        const ballsHtml = item.nums.map(n => `<div class="mini-ball ${getBallColorClass(n)}">${n}</div>`).join('');

        dom.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:6px;">
                 <span style="font-size:0.75rem; color:var(--text-muted);">${item.date} (${item.type})</span>
                 <div class="saved-balls-row">${ballsHtml}</div>
            </div>
            <button class="del-btn" data-id="${item.id}">🗑️</button>
        `;
        savedListEl.appendChild(dom);
    });

    // Delete binds
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const updated = loadArchive().filter(x => x.id !== id);
            localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
            renderArchiveList();
        });
    });
}

// 6. Archive Saver
btnSave.addEventListener('click', () => {
    if (!currentResult) return;
    const list = loadArchive();

    list.unshift({
        id: new Date().getTime().toString(),
        nums: currentResult,
        date: new Date().toLocaleString(),
        type: infoText.textContent.includes('AI') ? 'AI' : 'LOCAL'
    });

    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
    btnSave.disabled = true; // prevent double save
    renderArchiveList();
});

// --- Offline-First DB & Remote Fetch Logic ---
async function initializeLottoDb() {
    try {
        const res = await fetch('./js/lotto-db.json');
        if (res.ok) {
            lottoDb = await res.json();
        }
    } catch (e) {
        console.error("Failed to load local DB", e);
    }
}

async function fetchLatestLottoNumbers() {
    if (lottoDb.length === 0) {
        await initializeLottoDb();
    }

    // 1. Get the last record from local DB
    const lastLocalRecord = lottoDb.length > 0 ? lottoDb[lottoDb.length - 1] : null;
    let baseDrwNo = lastLocalRecord ? lastLocalRecord.drwNo : 0;

    // 2. Calculate the target latest draw number based on current time (Saturday 20:45)
    const epoch = new Date('2002-12-07T20:45:00+09:00').getTime();
    const now = new Date().getTime();
    let currentMaxDrwNo = Math.floor((now - epoch) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // 3. Fallback cache check and remote fetch for missing draws
    const LOCAL_SYNC_KEY = 'ai_lotto_synced_db';
    const syncedDataRaw = localStorage.getItem(LOCAL_SYNC_KEY);
    if (syncedDataRaw) {
        const synced = JSON.parse(syncedDataRaw);
        if (synced.length > 0 && synced[synced.length - 1].drwNo >= currentMaxDrwNo) {
            lottoDb = synced;
            const latest = lottoDb[lottoDb.length - 1];
            latestWinningNumbers = latest.nums;
            latestDrwNoInfo = { drwNo: latest.drwNo, date: latest.date };
            return latest.nums;
        } else if (synced.length > 0 && synced[synced.length - 1].drwNo > baseDrwNo) {
            lottoDb = synced;
            baseDrwNo = lottoDb[lottoDb.length - 1].drwNo;
        }
    }

    let isModified = false;
    for (let targetNo = baseDrwNo + 1; targetNo <= currentMaxDrwNo; targetNo++) {
        try {
            const response = await fetch(`/.netlify/functions/getData?drwNo=${targetNo}`);
            if (response.ok) {
                const data = await response.json();
                if (data.returnValue === "success") {
                    lottoDb.push({
                        drwNo: data.drwNo,
                        date: data.drwNoDate,
                        nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
                        bonus: data.bnusNo
                    });
                    isModified = true;
                } else {
                    currentMaxDrwNo = targetNo - 1; // Stop fetching further if not available
                    break;
                }
            }
        } catch (e) {
            console.error(`Failed to fetch drwNo ${targetNo}`, e);
            break;
        }
    }

    if (isModified) {
        localStorage.setItem(LOCAL_SYNC_KEY, JSON.stringify(lottoDb));
    }

    if (lottoDb.length > 0) {
        lottoDb.sort((a, b) => a.drwNo - b.drwNo);
        const latestInfo = lottoDb[lottoDb.length - 1];
        latestWinningNumbers = latestInfo.nums;
        latestDrwNoInfo = { drwNo: latestInfo.drwNo, date: latestInfo.date };
        return latestWinningNumbers;
    }

    return null;
}

// --- Local Filter Validation Logic ---
const parseCommaString = (str) => str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= 45);

function getAcValue(numbers) {
    const diffs = new Set();
    for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            diffs.add(Math.abs(numbers[i] - numbers[j]));
        }
    }
    return diffs.size - 5;
}

function getPatternGapjaLuckyNumber() {
    const epochDays = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    const gapjaIdx = epochDays % 60;
    // Map the cycle to a valid lotto number deterministically
    return (gapjaIdx * 7) % 45 + 1;
}

function checkConsecutiveAndBalance(numbers, maxConsec, maxColor) {
    let maxC = 1; let curC = 1;
    const counts = [0, 0, 0, 0, 0];

    for (let i = 0; i < numbers.length; i++) {
        // Color counter
        let n = numbers[i];
        if (n <= 10) counts[0]++; else if (n <= 20) counts[1]++; else if (n <= 30) counts[2]++;
        else if (n <= 40) counts[3]++; else counts[4]++;

        // Consec counter
        if (i > 0) {
            if (numbers[i] === numbers[i - 1] + 1) {
                curC++;
                if (curC > maxC) maxC = curC;
            } else { curC = 1; }
        }
    }
    return { consecPassed: maxC <= maxConsec, colorPassed: Math.max(...counts) <= maxColor };
}

function generateLocalNumbers() {
    saveSettings();
    const { sumMin, sumMax, oddEven, minAc, maxConsecutive, maxSameColor, zeroZone, highLow, gap, prime, multiple3, patternGapja, carryOver, neighborGap } = currentSettings;
    const inc = parseCommaString(currentSettings.includes);
    if (patternGapja === '1') {
        const luckyVal = getPatternGapjaLuckyNumber();
        if (!inc.includes(luckyVal)) inc.push(luckyVal);
    }
    const exc = parseCommaString(currentSettings.excludes);
    const targetOdd = oddEven === '3:3' ? 3 : (oddEven === '2:4' ? 2 : (oddEven === '4:2' ? 4 : -1));

    let attempts = 0;
    while (attempts < 200000) {
        attempts++;
        let pool = Array.from({ length: 45 }, (_, i) => i + 1).filter(n => !exc.includes(n));

        // Zero Zone drop logic BEFORE picking
        if (zeroZone === '1') {
            const zones = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 45]];
            const dropZone = zones[Math.floor(Math.random() * zones.length)];
            pool = pool.filter(n => n < dropZone[0] || n > dropZone[1]);
        }

        let candidate = [...inc];

        if (latestWinningNumbers) {
            if (carryOver === '1') {
                const pickC = Math.random() < 0.2 ? 2 : 1;
                const shuffledC = [...latestWinningNumbers].sort(() => Math.random() - 0.5).slice(0, pickC);
                shuffledC.forEach(n => { if (!candidate.includes(n)) candidate.push(n); });
            }
            if (neighborGap === '1') {
                const allNeighbors = new Set();
                latestWinningNumbers.forEach(n => { if (n - 1 >= 1) allNeighbors.add(n - 1); if (n + 1 <= 45) allNeighbors.add(n + 1); });
                latestWinningNumbers.forEach(n => allNeighbors.delete(n));
                const pickN = Math.random() < 0.2 ? 2 : 1;
                const shuffledN = Array.from(allNeighbors).sort(() => Math.random() - 0.5).slice(0, pickN);
                shuffledN.forEach(n => { if (!candidate.includes(n)) candidate.push(n); });
            }
        }

        let remainingToPick = 6 - candidate.length;

        if (candidate.length > 6 || (pool.length < remainingToPick && remainingToPick > 0)) break;

        const availablePool = pool.filter(n => !candidate.includes(n)).sort(() => Math.random() - 0.5);
        candidate = candidate.concat(availablePool.slice(0, remainingToPick));

        if (candidate.length !== 6) continue;
        candidate.sort((a, b) => a - b);

        const sum = candidate.reduce((a, b) => a + b, 0);
        if (sum < sumMin || sum > sumMax) continue;

        if (targetOdd !== -1 && candidate.filter(n => n % 2 !== 0).length !== targetOdd) continue;

        // High/Low
        if (highLow !== 'both') {
            const lowCount = candidate.filter(n => n <= 22).length;
            const highCount = candidate.filter(n => n >= 23).length;
            if (`${lowCount}:${highCount}` !== highLow) continue;
        }

        // Gap
        if (gap === '20-38') {
            const gapDiff = candidate[5] - candidate[0];
            if (gapDiff < 20 || gapDiff > 38) continue;
        }

        // Prime & Multiple of 3
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
        const primeCount = candidate.filter(n => primes.includes(n)).length;
        if (prime === '1-3' && (primeCount < 1 || primeCount > 3)) continue;
        const m3Count = candidate.filter(n => n % 3 === 0).length;
        if (multiple3 === '1-3' && (m3Count < 1 || m3Count > 3)) continue;

        if (minAc > 0 && getAcValue(candidate) < minAc) continue;

        const ccTest = checkConsecutiveAndBalance(candidate, maxConsecutive, maxSameColor);
        if (!ccTest.consecPassed || !ccTest.colorPassed) continue;

        return candidate;
    }
    return null;
}

document.getElementById('btn-generate-local').addEventListener('click', async () => {
    currentResult = null; btnSave.disabled = true;
    ballsContainer.style.display = 'none';
    spinner.style.display = 'block';
    infoText.textContent = '스마트 필터링 정보 수집 중...';

    // 항상 DB 동기화 확인 (백그라운드 + 이월수 로직 위함)
    await fetchLatestLottoNumbers();

    setTimeout(() => {
        spinner.style.display = 'none';
        ballsContainer.style.display = 'flex';
        renderBalls(generateLocalNumbers(), 'LOCAL');
    }, 50);
});

// 7. Generic Gemini API Caller
async function generateAiNumbers() {
    saveSettings();

    currentResult = null; btnSave.disabled = true;
    ballsContainer.style.display = 'none';
    spinner.style.display = 'block';
    infoText.textContent = 'AI가 우주의 기운으로 번호를 조합 중입니다... 🛸';

    let effectiveIncludes = currentSettings.includes;
    if (currentSettings.patternGapja === '1') {
        const luckyGapja = getPatternGapjaLuckyNumber();
        const curInc = parseCommaString(effectiveIncludes);
        if (!curInc.includes(luckyGapja)) curInc.push(luckyGapja);
        effectiveIncludes = curInc.join(', ');
    }

    // 항상 DB 동기화 확인
    await fetchLatestLottoNumbers();
    infoText.textContent = 'AI가 우주의 기운으로 번호를 조합 중입니다... 🛸 (분석 중)';

    let contextStr = '';
    if (latestWinningNumbers) {
        contextStr = `\n11. 직전 회차 당첨번호: [${latestWinningNumbers.join(', ')}]`;
        if (currentSettings.carryOver === '1') {
            contextStr += `\n    -> 필수조건: 위 직전 당첨번호 중 1~2개를 이월수로 반드시 포함할 것.`;
        }
        if (currentSettings.neighborGap === '1') {
            contextStr += `\n    -> 필수조건: 위 직전 당첨번호의 이웃수(+1 또는 -1 번호) 중 1~2개를 반드시 포함할 것.`;
        }
    }

    const prompt = `대한민국 로또 6/45 번호 추출기. 사용자의 6대 필터 조건을 100% 충족하는 행운의 번호 6개를 JSON Array 형식(예: [1,2,3,4,5,6])으로만 대답해줘. 백틱이나 부가설명 금지.
1. 포함 번호: [${effectiveIncludes}] (비어있으면 무시)
2. 제외 번호: [${currentSettings.excludes}] (비어있으면 무시)
3. 숫자 총합: ${currentSettings.sumMin} ~ ${currentSettings.sumMax}
4. 홀짝 형식: ${currentSettings.oddEven}
5. 저고(1~22/23~45) 비율: ${currentSettings.highLow === 'both' ? '상관없음' : currentSettings.highLow}
6. 번호 5대역 중 전멸구간: ${currentSettings.zeroZone === '1' ? '반드시 1개대역 이상 전멸' : '제한 없음'}
7. 소수 개수: ${currentSettings.prime === '1-3' ? '1~3개' : '상관없음'}, 3의 배수 개수: ${currentSettings.multiple3 === '1-3' ? '1~3개' : '상관없음'}
8. 최대-최소 간격(Gap): ${currentSettings.gap === '20-38' ? '20 ~ 38 사이' : '상관없음'}
9. AC값(간격의 종류 갯수 - 5)이 ${currentSettings.minAc} 이상, 연속된 숫자 ${currentSettings.maxConsecutive}개 초과 금지 
10. 번호 대역 별 최대출현: ${currentSettings.maxSameColor}개${contextStr}`;

    try {
        const url = `/.netlify/functions/getAiLotto`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

        const data = await response.json();
        const aiTextData = data.result;

        const match = aiTextData.match(/\[(.*?)\]/);
        if (match) {
            renderBalls(JSON.parse(match[0]), 'AI');
        } else {
            throw new Error("포맷 실패");
        }

    } catch (error) {
        console.error(error);
        alert(`AI 추천 실패. API 키나 모델 네트워크 상태를 확인하세요.\n${error.message}`);
        renderBalls([], 'LOCAL');
    } finally {
        ballsContainer.style.display = 'flex';
        spinner.style.display = 'none';
    }
}

document.getElementById('btn-generate-ai').addEventListener('click', generateAiNumbers);

// 8. QR Code Scanner Logic (jsQR)
const qrModal = document.getElementById('qr-modal');
const btnCloseQr = document.getElementById('btn-close-qr');
const btnQrScan = document.getElementById('btn-qr-scan');

const video = document.getElementById('qr-video');
const canvasElement = document.getElementById('qr-canvas');
const canvas = canvasElement.getContext('2d');
const loadingOverlay = document.getElementById('qr-loading');
const guideOverlay = document.getElementById('qr-guide');

let scanningObj = null; // req animation frame id
let videoStream = null;

function drawLine(begin, end, color) {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
}

function stopScanning() {
    if (scanningObj) cancelAnimationFrame(scanningObj);
    if (videoStream) {
        videoStream.getTracks().forEach(track => {
            track.stop();
        });
    }
    video.srcObject = null;
    qrModal.style.display = 'none';
    video.style.display = 'none';
    guideOverlay.style.display = 'none';
    loadingOverlay.style.display = 'block';
}

function scanFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingOverlay.style.display = 'none';
        video.style.display = 'block';
        guideOverlay.style.display = 'block';

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

        // jsQR 판독
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
            drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
            drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
            drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");

            const decodedText = code.data;
            if (decodedText.includes('dhlottery.co.kr')) {
                stopScanning();
                window.open(decodedText, '_blank');
                return; // halt frame checking
            } else if (decodedText.startsWith('http')) {
                stopScanning();
                if (confirm("QR코드에서 URL을 찾았습니다. 이동하시겠습니까?\n" + decodedText)) {
                    window.open(decodedText, '_blank');
                }
                return;
            }
        }
    }
    scanningObj = requestAnimationFrame(scanFrame);
}

if (btnQrScan && qrModal) {
    btnQrScan.addEventListener('click', () => {
        qrModal.style.display = 'flex';
        loadingOverlay.style.display = 'block';

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
            videoStream = stream;
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            scanningObj = requestAnimationFrame(scanFrame);
        }).catch(function (err) {
            alert("카메라 권한을 확인할 수 없습니다. 브라우저 설정에서 카메라 접근을 허용해주세요.\n에러: " + err);
            qrModal.style.display = 'none';
        });
    });

    btnCloseQr.addEventListener('click', () => {
        stopScanning();
    });
}

// 9. Past Record Logic
const pastModal = document.getElementById('past-record-modal');
const btnClosePast = document.getElementById('btn-close-past-record');
const btnPastRecord = document.getElementById('btn-past-record');
const btnFetchPast = document.getElementById('btn-fetch-past');
const inputPastDrwNo = document.getElementById('past-drw-no');
const pastResult = document.getElementById('past-record-result');

if (btnPastRecord && pastModal) {
    btnPastRecord.addEventListener('click', async () => {
        pastModal.style.display = 'flex';
        pastResult.innerHTML = '<div class="spinner"></div><p style="margin-top:10px; font-size:12px; color:var(--text-main);">최근 5회차 조회 중...</p>';

        if (lottoDb.length === 0) {
            await fetchLatestLottoNumbers();
        }

        if (inputPastDrwNo.options && inputPastDrwNo.options.length <= 1) {
            let latestNo = latestDrwNoInfo ? latestDrwNoInfo.drwNo : (lottoDb.length > 0 ? lottoDb[lottoDb.length - 1].drwNo : 0);
            for (let i = latestNo; i >= 1; i--) {
                let opt = document.createElement('option');
                opt.value = i;
                opt.text = i + '회';
                inputPastDrwNo.add(opt);
            }
        }

        inputPastDrwNo.value = '';
        btnFetchPast.click();
    });

    btnClosePast.addEventListener('click', () => {
        pastModal.style.display = 'none';
    });

    btnFetchPast.addEventListener('click', async () => {
        let drwNo = parseInt(inputPastDrwNo.value, 10);

        // Always check our offline hybrid DB first
        if (lottoDb.length === 0) {
            await fetchLatestLottoNumbers();
        }

        let targetDrwNo = drwNo;
        let endNo;

        if (!targetDrwNo || isNaN(targetDrwNo) || targetDrwNo < 1) {
            if (latestDrwNoInfo) {
                targetDrwNo = latestDrwNoInfo.drwNo;
            } else {
                targetDrwNo = lottoDb.length > 0 ? lottoDb[lottoDb.length - 1].drwNo : 1;
            }
            endNo = Math.max(1, targetDrwNo - 4); // Up to 5 draws
        } else {
            endNo = targetDrwNo; // Only 1 draw
        }

        pastResult.innerHTML = '<div class="spinner"></div><p style="margin-top:10px; font-size:12px; color:var(--text-main);">조회 중...</p>';

        let resultsHtml = '';

        pastResult.style.padding = '0'; // clear default padding since we use cards inside
        pastResult.style.background = 'transparent';

        for (let i = targetDrwNo; i >= endNo; i--) {
            let record = lottoDb.find(r => r.drwNo === i);

            // Generate HTML for the record if found, else attempt fetch (though unlikely if synced)
            if (!record) {
                try {
                    const response = await fetch(`/.netlify/functions/getData?drwNo=${i}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.returnValue === "success") {
                            record = {
                                drwNo: data.drwNo,
                                date: data.drwNoDate,
                                nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
                                bonus: data.bnusNo
                            };
                            // Optional: save back to lottoDb if needed
                        }
                    }
                } catch (e) {
                    console.error('Fetch error for past draw ' + i, e);
                }
            }

            if (record) {
                const innerHtml = record.nums.map(n => `<div class="mini-ball ${getBallColorClass(n)}">${n}</div>`).join('');
                resultsHtml += `
                    <div class="saved-item" style="flex-direction: column; align-items: center; gap: 8px; width: 100%; border-radius:16px;">
                        <p style="margin-bottom: 4px; font-weight: 600; font-size:1.05rem; color: #fff;">
                            제 ${record.drwNo}회 <span style="font-size: 0.8rem; color: var(--text-muted); font-weight:400;">(${record.date})</span>
                        </p>
                        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; justify-content:center;">
                            ${innerHtml}
                            <span style="margin:0 4px; font-weight:bold; color:var(--text-muted); font-size:1.2rem;">+</span>
                            <div class="mini-ball ${getBallColorClass(record.bonus)}">${record.bonus}</div>
                        </div>
                    </div>
                `;
            }
        }

        if (resultsHtml) {
            pastResult.innerHTML = `<div style="width:100%; display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto; padding-right:5px;">${resultsHtml}</div>`;
        } else {
            pastResult.innerHTML = '<p class="empty-text" style="color:#e74c3c; padding:1rem; background: rgba(0,0,0,0.2); border-radius:8px;">조회 결과가 없습니다. 올바른 회차인지 확인해주세요.</p>';
        }
    });
}

loadSettings();
renderArchiveList();

// 9. Intro Video Logic
document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('intro-screen');
    const introVideo = document.getElementById('intro-video');

    if (introScreen && introVideo) {
        // Attempt to play just in case autoplay acts weird on some browsers
        const playPromise = introVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log('Autoplay prevented:', e));
        }

        const hideIntro = () => {
            if (introScreen.style.display === 'none') return;
            introScreen.classList.add('hidden');
            setTimeout(() => {
                introScreen.style.display = 'none';
            }, 800);
        };

        // When the video ends, hide the overlay
        introVideo.addEventListener('ended', hideIntro);

        // Fallback: maximum 10 seconds (영상 길이보다 약간 길게 10초로 변경)
        setTimeout(hideIntro, 10000);
    }
});

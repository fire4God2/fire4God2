const fs = require('fs');
const https = require('https');
const path = require('path');

function getLatestDrawNo() {
  const firstDrawDate = new Date('2002-12-07T20:45:00+09:00');
  const now = new Date();
  const diffTime = now.getTime() - firstDrawDate.getTime();
  return Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
}

function fetchLottoData(drawNo) {
  return new Promise((resolve, reject) => {
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error for drwNo ${drawNo}: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const dbPath = path.join(__dirname, 'js', 'lotto-db.json');
    let db = [];

    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }

    const lastDrwNo = db.length > 0 ? db[db.length - 1].drwNo : 0;
    const latestDrawNo = getLatestDrawNo();
    console.log(`[INFO] DB 마지막: ${lastDrwNo}회, 최신 예상: ${latestDrawNo}회`);

    if (lastDrwNo >= latestDrawNo) {
      console.log('[INFO] 이미 최신 상태입니다.');
      return;
    }

    let newCount = 0;
    for (let no = lastDrwNo + 1; no <= latestDrawNo; no++) {
      try {
        const data = await fetchLottoData(no);
        if (data.returnValue === 'success') {
          db.push({
            drwNo: data.drwNo,
            date: data.drwNoDate,
            nums: [data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6],
            bonus: data.bnusNo
          });
          newCount++;
          console.log(`  [+] ${data.drwNo}회 추가`);
        } else {
          console.log(`  [SKIP] ${no}회 아직 미확정`);
          break;
        }
      } catch (e) {
        console.error(`  [ERROR] ${no}회 fetch 실패:`, e.message);
        break;
      }
    }

    if (newCount > 0) {
      db.sort((a, b) => a.drwNo - b.drwNo);
      fs.writeFileSync(dbPath, JSON.stringify(db), 'utf-8');
      console.log(`[SUCCESS] ${newCount}건 추가 완료 (총 ${db.length}건). lotto-db.json 업데이트됨.`);
    } else {
      console.log('[INFO] 새로 추가할 데이터가 없습니다.');
    }
  } catch (error) {
    console.error('[ERROR] 스크립트 실행 중 문제:', error);
    process.exit(1);
  }
}

main();

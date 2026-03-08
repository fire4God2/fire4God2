const fs = require('fs');
const https = require('https');
const path = require('path');

function getLatestDrawNo() {
  // 1회차 추첨일 (2002년 12월 7일 오후 8시 45분 KST 기준)
  const firstDrawDate = new Date('2002-12-07T20:45:00+09:00');
  const now = new Date();
  
  // 밀리초 단위 차이 계산 후 일(day) 단위로 변환
  const diffTime = now.getTime() - firstDrawDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 7일마다 1회차씩 증가
  return Math.floor(diffDays / 7) + 1;
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
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const latestDrawNo = getLatestDrawNo();
    console.log(`[INFO] 계산된 최신 회차: ${latestDrawNo}회`);
    
    const data = await fetchLottoData(latestDrawNo);
    
    if (data.returnValue === 'success') {
      const filePath = path.join(__dirname, 'latest_lotto.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`[SUCCESS] ${latestDrawNo}회차 데이터를 latest_lotto.json에 저장했습니다.`);
    } else {
      console.error('[ERROR] 데이터를 불러오지 못했습니다. (아직 추첨 전일 수 있습니다)', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('[ERROR] 스크립트 실행 중 문제가 발생했습니다:', error);
    process.exit(1);
  }
}

main();

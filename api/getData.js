// Vercel Serverless Function: /api/getData
// 동행복권 API 프록시 (CORS 우회)
export default async function handler(req, res) {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { drwNo } = req.query;

    if (!drwNo) {
        return res.status(400).json({ error: 'Missing drwNo parameter' });
    }

    try {
        // 동행복권 사이트가 해외 서버 요청을 차단할 수 있으므로 User-Agent 헤더 필수
        const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9',
                'Referer': 'https://www.dhlottery.co.kr/'
            }
        });

        if (!response.ok) {
            return res.status(502).json({
                error: 'External API returned error',
                status: response.status,
                statusText: response.statusText
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            error: 'Failed fetching data from external API',
            details: error.message
        });
    }
}

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
        const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
        const response = await fetch(targetUrl);
        const data = await response.json();

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed fetching data from external API' });
    }
}

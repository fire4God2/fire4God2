// Vercel Serverless Function: /api/getAiLotto
// Gemini API 프록시 (API 키 보호)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Vercel 환경 변수에서 Gemini API 키 읽기
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.MY_SECRET_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server API Key is not configured.' });
    }

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided' });
        }

        const modelEndpoint = 'gemini-2.5-flash-lite';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.85 }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        const aiTextData = data.candidates[0].content.parts[0].text;

        return res.status(200).json({ result: aiTextData });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

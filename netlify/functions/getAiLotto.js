exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed"
        };
    }

    // Netlify 환경 변수에 설정된 Gemini API 키 (GEMINI_API_KEY 로 가정. 수정 가능)
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.MY_SECRET_API_KEY;
    
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server API Key is not configured." })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const prompt = body.prompt;

        if (!prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "No prompt provided" })
            };
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

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ result: aiTextData })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};

exports.handler = async function(event, context) {
    const drwNo = event.queryStringParameters.drwNo;
    
    // 요청하신 MY_SECRET_API_KEY 환경 변수 읽기
    // (현재 동행복권 API에는 불필요하지만 다른 API 연동시 사용 가능)
    const apiKey = process.env.MY_SECRET_API_KEY;

    if (!drwNo) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: "Missing drwNo parameter" })
        };
    }

    try {
        const targetUrl = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
        const response = await fetch(targetUrl);
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                // CORS 헤더 설정
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: "Failed fetching data from external API" })
        };
    }
};

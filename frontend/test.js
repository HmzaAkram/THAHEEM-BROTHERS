const http = require('http');

async function test() {
    console.log("=== Testing Proxy ===");
    try {
        const loginRes = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@thaheem.com", password: "admin123" })
        });

        console.log("Login Status:", loginRes.status);
        const text = await loginRes.text();
        console.log("Login Body:", text);
        if (!loginRes.ok) return;

        const cookies = loginRes.headers.get('set-cookie');
        console.log("Cookies:", cookies);

        const token = cookies.match(/auth_token=([^;]+)/)[1];

        const companiesRes = await fetch("http://localhost:3000/api-proxy/companies", {
            headers: {
                "Cookie": `auth_token=${token}`
            }
        });

        console.log("Companies Status:", companiesRes.status);
        const data = await companiesRes.text();
        console.log("Response:", data.substring(0, 100));
    } catch (e) {
        console.error(e);
    }
}

test();

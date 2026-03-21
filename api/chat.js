export default async function handler(req, res) {
    // --- CORS headers ---
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // --- Preflight ---
    if (req.method === "OPTIONS") {
        console.log("OPTIONS preflight request received");
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        console.log("Non-POST request received:", req.method);
        return res.status(405).send("Only POST allowed");
    }

    try {
        const { message } = req.body;
        console.log("Incoming message from frontend:", message);

        if (!process.env.OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY is missing!");
            return res.status(500).json({ reply: "Server misconfigured: missing API key" });
        }

        console.log("Sending request to OpenAI...");
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
You are a polite dental assistant.
Collect name, email, phone.
Be friendly and concise.
Do not mention AI.
`
                    },
                    { role: "user", content: message }
                ]
            })
        });

        console.log("OpenAI HTTP status:", response.status);

        const data = await response.json();
        console.log("Full OpenAI response:", JSON.stringify(data, null, 2));

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.warn("OpenAI response missing choices or message:", data);
            return res.status(500).json({ reply: "AI did not return a valid response" });
        }

        const reply = data.choices[0].message.content;
        console.log("Reply extracted from OpenAI:", reply);

        res.status(200).json({ reply });

    } catch (error) {
        console.error("Error in backend:", error);
        res.status(500).json({ reply: "Error connecting to backend" });
    }
}
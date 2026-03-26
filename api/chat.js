let conversations = {};

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

    conversations[sessionId].push({
        role: "user",
        content: message
    });

    try {
        const { message } = req.body;
        const sessionId = localStorage.getItem("chat_id") || crypto.randomUUID();
        localStorage.setItem("chat_id", sessionId);

        if (!conversations[sessionId]) {
            conversations[sessionId] = [
            ];
        }
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
                "x-session-id": sessionId
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: conversations[sessionId]
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
        await new Promise(r => setTimeout(r, 200));

        conversations[sessionId].push({
            role: "assistant",
            content: reply
        });

        console.log("Reply extracted from OpenAI:", reply);

        res.status(200).json({ reply });

    } catch (error) {
        console.error("Error in backend:", error);
        res.status(500).json({ reply: "Error connecting to backend" });
    }
}
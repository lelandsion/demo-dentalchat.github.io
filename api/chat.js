export default async function handler(req, res) {
    // CORS headers (important for frontend requests)
    res.setHeader("Access-Control-Allow-Origin", "*"); // allow all domains
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Preflight response
    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") return res.status(405).send("Only POST allowed");


    try {
        const { message } = req.body;

        // Log incoming message
        console.log("Incoming message:", message);

        // Check API key
        if (!process.env.OPENAI_API_KEY) {
            console.error("OPENAI_API_KEY is missing!");
            return res.status(500).json({ reply: "Server misconfigured: missing API key" });
        }

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

        // Log HTTP response status
        console.log("OpenAI response status:", response.status);

        const data = await response.json();

        // Log full response (optional, for debugging)
        console.log("OpenAI response data:", data);

        const reply = data.choices?.[0]?.message?.content || "No response";
        res.status(200).json({ reply });

    } catch (error) {
        console.error("Error in backend:", error);
        res.status(500).json({ reply: "Error connecting to backend" });
    }
}
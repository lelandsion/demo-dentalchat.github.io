import fetch from "node-fetch";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).send("Only POST allowed");

    const { message } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
                { role: "system", content: "You are a polite dental assistant. Collect name, email, phone." },
                { role: "user", content: message }
            ]
        })
    });

    const data = await response.json();
    res.status(200).json({ reply: data.choices[0].message.content });
}
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
    const apiKey = process.env.NANO_BANANA_API_KEY;
    if (!apiKey) {
        console.error("API Key not set");
        return;
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const reference = fs.readFileSync('/Users/charles/Documents/pruebaInstagram/referencia.jpeg').toString('base64');
        const avatar = fs.readFileSync('/Users/charles/Documents/pruebaInstagram/avatar.png').toString('base64');
        const bag = fs.readFileSync('/Users/charles/Documents/pruebaInstagram/bolso.png').toString('base64');

        console.log("Sending request to Google API using nano-banana-pro-preview...");
        const response = await ai.models.generateContent({
            model: 'models/nano-banana-pro-preview',
            contents: [
                'Replace face with avatar and bag with product.',
                {
                    inlineData: {
                        data: reference,
                        mimeType: 'image/jpeg'
                    }
                },
                {
                    inlineData: {
                        data: avatar,
                        mimeType: 'image/png'
                    }
                },
                {
                    inlineData: {
                        data: bag,
                        mimeType: 'image/png'
                    }
                }
            ]
        });

        // Check parts
        const parts = response.candidates?.[0]?.content?.parts;
        console.log("Returned parts:", parts?.length);
        if (parts) {
            parts.forEach((p, i) => {
                if (p.inlineData?.data) {
                    console.log("Found inlineData length:", p.inlineData.data?.length);
                    console.log("mimeType:", p.inlineData.mimeType);
                    fs.writeFileSync('/Users/charles/Documents/apps/creadorPostInstagram/test_output.jpg', Buffer.from(p.inlineData.data!, 'base64'));
                    console.log("Saved test_output.jpg!");
                } else if (p.text) {
                    console.log("Text part length:", p.text.length);
                } else {
                    console.log("Other part:", Object.keys(p));
                }
            });
        }
    } catch (e: any) {
        console.error("Error from API:", e);
    }
}

main();

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
    const apiKey = process.env.NANO_BANANA_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    try {
        const list = await ai.models.list(); // if available
        console.log(list);
    } catch (e: any) {
        console.error("Error from API:", e);
    }
}
main();

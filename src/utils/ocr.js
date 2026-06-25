/**
 * OCR Utility for scanning Release Orders via Google Gemini API.
 */

const SYSTEM_PROMPT = `You are a data-extraction engine for an Indian newspaper's advertising billing system (Shan Times).
You receive a Release Order (RO) document and must extract the fields needed to raise a GST advertising bill.

Return ONLY a JSON object with this exact shape:
{
  "billNo": string,            // bill / invoice number if present, else ""
  "billDate": string,          // DD/MM/YYYY if present, else ""
  "to": string,                // the ADVERTISING COMPANY / AGENCY that issued this Release Order — their name and full address (use \\n between lines). This is the party being billed, not the end advertiser/brand.
  "clientGst": string,         // the advertising company's / agency's GSTIN, else ""
  "clientRef": string,         // any client reference / caption / order ref, else ""
  "releaseOrderNo": string,    // the Release Order number
  "releaseOrderDate": string,  // RO date as DD/MM/YYYY
  "taxType": "intra" | "inter",// "intra" if the advertising company is within Uttar Pradesh (U.P.), else "inter"
  "items": [
    {
      "dateOfPublication": string, // DD/MM/YYYY (one entry per publication date/insertion)
      "particulars": string,       // advertisement description / caption / matter
      "wordsSize": string,         // size like "4x10 cm" or column x cm, or word count
      "totalSpace": string,        // total space if explicitly stated, else ""
      "rate": string               // rate per unit / per sq cm as a plain number, else ""
    }
  ]
}

Rules:
- Extract dates in DD/MM/YYYY format.
- Create one item per insertion / publication date. If the RO lists multiple dates for the same ad, create one item per date.
- Numbers must be plain digits (no currency symbols or commas) e.g. "2200" not "Rs. 2,200".
- For sizes keep the form the user wrote, e.g. "4x10" so dimensions can be auto-multiplied.
- If a field is unknown, use an empty string "". Never invent data.
- Return strictly valid JSON, no markdown fences, no commentary.`;

/**
 * Sends a file to Gemini for OCR extraction.
 * @param {File} file - The PDF or Image file
 * @param {string} apiKey - Google Gemini API Key
 * @returns {Promise<Object>} The parsed JSON data
 */
export async function scanReleaseOrder(file, apiKey) {
  if (!apiKey) {
    throw new Error("Missing Gemini API Key.");
  }

  // Convert File to Base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

  const mimeType = file.type;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          },
          { text: "Extract the billing fields from this Release Order document and return the JSON object." }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    let errorDetail = "";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.error?.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`Scan failed (${res.status}): ${errorDetail}`);
  }

  const data = await res.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error("Empty response from AI.");
  }

  try {
    const cleaned = textContent.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse AI response as JSON:", textContent);
    throw new Error("Could not parse the extracted data. Please try a clearer document.");
  }
}

const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const HEADERS = [
  "Received at",
  "Guest name",
  "Attendance",
  "Message",
  "Language",
  "Submitted at",
  "Page URL",
  "Submission ID",
  "User agent",
];

let cachedAccessToken = null;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true }, 200, cors);
    }

    if (request.method !== "POST" || url.pathname !== "/rsvp") {
      return json({ success: false, error: "Not found." }, 404, cors);
    }

    if (!originIsAllowed(request, env)) {
      return json({ success: false, error: "Origin is not allowed." }, 403, cors);
    }

    try {
      const submission = await parseSubmission(request);

      if (submission.honeypot) {
        return json({ success: true }, 200, cors);
      }

      const validationError = validateSubmission(submission);
      if (validationError) {
        return json({ success: false, error: validationError }, 422, cors);
      }

      const credentials = parseCredentials(env.SERVICE_ACCOUNT_KEY);
      const accessToken = await getAccessToken(credentials);
      const sheetName = await ensureSheet(accessToken, env.SPREADSHEET_ID, env.SHEET_NAME);

      await appendSubmission(accessToken, env.SPREADSHEET_ID, sheetName, submission, request);

      return json({ success: true }, 200, cors);
    } catch (error) {
      console.error("RSVP submission failed", safeErrorSummary(error));
      return json({ success: false, error: "The RSVP could not be saved." }, 500, cors);
    }
  },
};

async function parseSubmission(request) {
  const contentType = request.headers.get("content-type") || "";
  let values;

  if (contentType.includes("application/json")) {
    values = await request.json();
  } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    values = Object.fromEntries(await request.formData());
  } else {
    throw new Error("Unsupported RSVP content type");
  }

  return {
    name: clean(values.name, 100),
    attendance: clean(values.attendance, 30),
    message: clean(values.message, 500),
    language: clean(values.language, 2).toLowerCase(),
    submittedAt: clean(values.submitted_at, 40),
    pageUrl: clean(values.page_url, 300),
    submissionId: clean(values.submission_id, 100) || crypto.randomUUID(),
    honeypot: clean(values._honey, 200),
  };
}

function validateSubmission(submission) {
  if (submission.name.length < 2) {
    return "Please enter a valid name.";
  }

  if (!["Attending", "Not attending"].includes(submission.attendance)) {
    return "Please choose an attendance option.";
  }

  if (!["en", "ar"].includes(submission.language)) {
    return "The RSVP language is invalid.";
  }

  return null;
}

function parseCredentials(rawCredentials) {
  if (!rawCredentials) {
    throw new Error("SERVICE_ACCOUNT_KEY is not configured");
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error("SERVICE_ACCOUNT_KEY is not valid service-account JSON");
  }

  if (
    credentials.type !== "service_account"
    || !credentials.client_email
    || !credentials.private_key
    || credentials.token_uri !== "https://oauth2.googleapis.com/token"
  ) {
    throw new Error("SERVICE_ACCOUNT_KEY is missing required fields");
  }

  return credentials;
}

async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken?.expiresAt > now + 60) {
    return cachedAccessToken.value;
  }

  const assertion = await createJwt(credentials, now);
  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.access_token) {
    throw new GoogleApiError("Google token request failed", response.status);
  }

  cachedAccessToken = {
    value: result.access_token,
    expiresAt: now + Number(result.expires_in || 3600),
  };

  return cachedAccessToken.value;
}

async function createJwt(credentials, now) {
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(credentials.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${encodeBase64Url(signature)}`;
}

async function ensureSheet(accessToken, spreadsheetId, requestedSheetName) {
  const sheetName = requestedSheetName || "RSVP Responses";
  const metadata = await googleRequest(
    `${GOOGLE_SHEETS_API}/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`,
    accessToken,
  );
  const existingSheet = metadata.sheets?.find((sheet) => sheet.properties?.title === sheetName);

  if (!existingSheet) {
    await googleRequest(
      `${GOOGLE_SHEETS_API}/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName } } }] }),
      },
    );
  }

  const headerRange = `${quoteSheetName(sheetName)}!A1:I1`;
  const headerValues = await googleRequest(valuesUrl(spreadsheetId, headerRange), accessToken);

  if (!headerValues.values?.[0]?.length) {
    await googleRequest(
      `${valuesUrl(spreadsheetId, headerRange)}?valueInputOption=RAW`,
      accessToken,
      {
        method: "PUT",
        body: JSON.stringify({ range: headerRange, majorDimension: "ROWS", values: [HEADERS] }),
      },
    );
  }

  return sheetName;
}

async function appendSubmission(accessToken, spreadsheetId, sheetName, submission, request) {
  const range = `${quoteSheetName(sheetName)}!A:I`;
  const values = [[
    new Date().toISOString(),
    safeSheetCell(submission.name),
    submission.attendance,
    safeSheetCell(submission.message),
    submission.language,
    submission.submittedAt,
    safeSheetCell(submission.pageUrl),
    safeSheetCell(submission.submissionId),
    safeSheetCell(clean(request.headers.get("user-agent"), 300)),
  ]];

  await googleRequest(
    `${valuesUrl(spreadsheetId, range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ range, majorDimension: "ROWS", values }),
    },
  );
}

async function googleRequest(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new GoogleApiError("Google Sheets API request failed", response.status);
  }

  return result || {};
}

function valuesUrl(spreadsheetId, range) {
  return `${GOOGLE_SHEETS_API}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
}

function quoteSheetName(sheetName) {
  return `'${sheetName.replaceAll("'", "''")}'`;
}

function clean(value, maximumLength) {
  return String(value ?? "").trim().slice(0, maximumLength);
}

function safeSheetCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function pemToArrayBuffer(pem) {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function encodeBase64Url(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function originIsAllowed(request, env) {
  const origin = request.headers.get("origin");
  return Boolean(origin && allowedOrigins(env).includes(origin));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin");
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };

  if (origin && allowedOrigins(env).includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function json(value, status, headers) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeErrorSummary(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || "Unknown error",
    status: error?.status || undefined,
  };
}

class GoogleApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

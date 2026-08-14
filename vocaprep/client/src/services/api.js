// src/services/api.js
//
// Every call the frontend makes to our Express backend lives here.
// The frontend never talks to Sarvam directly and never sees an API key.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function handleResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (_) {
    // non-JSON response (e.g. server crashed) - fall through to generic error
  }

  if (!response.ok) {
    const message =
      (body && body.error) || `Request failed with status ${response.status}.`;
    const error = new Error(message);
    error.code = body && body.code;
    error.status = response.status;
    throw error;
  }

  return body;
}

export async function speechToText(audioBlob) {
  const formData = new FormData();
  const extension = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  formData.append("audio", audioBlob, `recording.${extension}`);

  let response;
  try {
    response = await fetch(`${API_URL}/api/speech-to-text`, {
      method: "POST",
      body: formData,
    });
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }

  return handleResponse(response);
}

export async function evaluateAnswer(question, transcript, mode = "practice") {
  let response;
  try {
    response = await fetch(`${API_URL}/api/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, transcript, mode }),
    });
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }

  return handleResponse(response);
}

export async function generateInterviewQuestion(data) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/interview/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }

  return handleResponse(response);
}

export async function generateInterviewReport(data) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/interview/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }

  return handleResponse(response);
}

export async function getPracticeHistory(limit = 20) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/history/practice?limit=${limit}`);
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }
  return handleResponse(response);
}

export async function getInterviewHistory(limit = 20) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/history/interviews?limit=${limit}`);
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }
  return handleResponse(response);
}

export async function getInterviewDetail(id) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/history/interviews/${id}`);
  } catch (networkErr) {
    throw new Error("Couldn't reach the VocaPrep server. Is it running on port 5001?");
  }
  return handleResponse(response);
}
import React, { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 180; // hard safety cap (3 minutes)

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Recorder({ onRecordingComplete, disabled, resetSignal }) {
  const [status, setStatus] = useState("idle"); // idle | recording | recorded | error
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    cleanupStream();
    setStatus("idle");
    setSeconds(0);
    setAudioUrl(null);
    setErrorMsg("");
    chunksRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      cleanupStream();
      clearInterval(timerRef.current);
    };
  }, []);

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    clearInterval(timerRef.current);
  }

  async function startRecording() {
    setErrorMsg("");

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setStatus("error");
      setErrorMsg("Your browser doesn't support audio recording. Try the latest Chrome, Edge, or Firefox.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });

        if (blob.size === 0) {
          setStatus("error");
          setErrorMsg("The recording came out empty. Please check your microphone and try again.");
          return;
        }

        setAudioUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        onRecordingComplete(blob);
      };

      recorder.onerror = () => {
        cleanupStream();
        setStatus("error");
        setErrorMsg("Something went wrong while recording. Please try again.");
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone access was denied. Please allow microphone permission and try again.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No microphone was found. Please connect a microphone and try again.");
      } else {
        setErrorMsg("Couldn't access your microphone. Please check your device settings and try again.");
      }
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function reRecord() {
    setStatus("idle");
    setSeconds(0);
    setAudioUrl(null);
    setErrorMsg("");
    chunksRef.current = [];
  }

  return (
    <div className="recorder">
      <div className={`recorder__orb-wrap recorder__orb-wrap--${status}`}>
        {status === "recording" && (
          <>
            <span className="recorder__ring recorder__ring--1" />
            <span className="recorder__ring recorder__ring--2" />
          </>
        )}
        <button
          className={`recorder__orb recorder__orb--${status}`}
          onClick={status === "recording" ? stopRecording : startRecording}
          disabled={disabled || status === "recorded"}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
        >
          {status === "recording" ? "■" : "🎙"}
        </button>
      </div>

      <div className="recorder__status">
        {status === "idle" && <span className="recorder__label">Start Recording</span>}
        {status === "recording" && (
          <>
            <span className="recorder__label recorder__label--live">🔴 Recording...</span>
            <span className="recorder__timer">{formatTime(seconds)}</span>
          </>
        )}
        {status === "recorded" && <span className="recorder__label recorder__label--done">✓ Recording captured</span>}
        {status === "error" && <span className="recorder__label recorder__label--error">⚠ {errorMsg}</span>}
      </div>

      {status === "recording" && (
        <button className="btn btn--stop" onClick={stopRecording} disabled={disabled}>
          ■ Stop Recording
        </button>
      )}

      {status === "recorded" && audioUrl && (
        <div className="recorder__playback">
          <audio controls src={audioUrl} className="recorder__audio" />
          <button className="btn btn--ghost" onClick={reRecord} disabled={disabled}>
            ↻ Re-record
          </button>
        </div>
      )}

      {status === "error" && (
        <button className="btn btn--secondary" onClick={reRecord}>
          Try Again
        </button>
      )}
    </div>
  );
}
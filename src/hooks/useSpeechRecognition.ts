// useSpeechRecognition — a custom hook that wraps the browser's Web Speech API.
//
// WHY a custom hook?
// The Web Speech API has multiple methods (start, stop, abort), event listeners,
// and state (isListening, transcript, error). Wrapping all of this in a hook
// keeps components clean — they just call useSpeechRecognition() and get
// simple values and functions.
//
// In Hisaab किताब, the shopkeeper taps a mic button and speaks an order.
// This hook captures the speech, converts it to text, and returns the transcript
// so the app can parse "manoj bhai 1 tea" into customer name, quantity, and item.

import { useState, useCallback, useRef, useEffect } from "react";

// The Web Speech API is a browser feature, not a standard JS API.
// With our speech-recognition.d.ts declarations, TypeScript knows about window.SpeechRecognition.
// Chrome uses SpeechRecognition; some older browsers use webkitSpeechRecognition.
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

interface SpeechRecognitionResult {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useRef stores a mutable reference that persists across re-renders
  // without causing re-renders itself (unlike useState).
  // We need this to hold the SpeechRecognition instance because
  // it's a long-lived object that shouldn't be recreated on every render.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Cleanup on unmount — stop any ongoing recognition when the component disappears.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    // If the browser doesn't support Web Speech API, show an error.
    if (!SpeechRecognitionAPI) {
      setError("आपका ब्राउज़र वॉइस रिकग्निशन सपोर्ट नहीं करता।");
      return;
    }

    setError(null);
    setTranscript("");

    // Create a new recognition instance each time — the API is stateful
    // and can't be restarted cleanly after it ends.
    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    // Configure: we want Hindi + English, single-shot (not continuous).
    recognition.lang = "hi-IN"; // Hindi primary, Chrome auto-detects English words too
    recognition.interimResults = false; // Only final results, not partial
    recognition.maxAlternatives = 1; // Only the best match

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // The transcript is the text Chrome understood from the audio.
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" means the user didn't say anything — not really an error.
      if (event.error === "no-speech") {
        setError("कुछ सुनाई नहीं दिया। फिर से कोशिश करें।");
      } else if (event.error === "not-allowed") {
        setError("माइक की अनुमति नहीं मिली। ब्राउज़र सेटिंग्स जांचें।");
      } else {
        setError("आवाज़ समझ नहीं आई। फिर से बोलें।");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Start listening — this triggers the browser's microphone permission prompt
    // if the user hasn't already allowed it.
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
    isSupported: !!SpeechRecognitionAPI,
  };
}

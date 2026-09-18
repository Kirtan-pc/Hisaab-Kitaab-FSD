import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechErrorKey = "voiceUnsupported" | "voiceRetry";

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechErrorKey | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const startListening = useCallback(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("voiceUnsupported");
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setError(null);
    setTranscript("");
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setTranscript(event.results[0]?.[0]?.transcript ?? "");
    };
    recognition.onerror = () => {
      setError("voiceRetry");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { transcript, isListening, error, startListening, stopListening };
}

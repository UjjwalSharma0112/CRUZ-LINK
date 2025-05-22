import { useEffect, useState } from "react";

const useGoogleVoice = (voiceName = "Google US English") => {
  const [googleVoice, setGoogleVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === voiceName);
      if (match) {
        setGoogleVoice(match);
        console.log("✅ Google voice loaded:", match.name);
      } else {
        console.warn("❌ Google voice not found.");
      }
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [voiceName]);

  return googleVoice;
};

export default useGoogleVoice;

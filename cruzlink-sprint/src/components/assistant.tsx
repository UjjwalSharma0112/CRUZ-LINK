"use client";

import { useEffect, useState, useRef } from "react";
import { usePorcupine } from "@picovoice/porcupine-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { getGeminiResponse } from "@/utils/gemini";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Heart, User, Battery } from "lucide-react";
import useGoogleVoice from "@/hooks/useGoogleVoice";

export default function VoiceAssistant() {
  const {
    keywordDetection,
    isLoaded,
    isListening: isWakewordListening,
    init,
    start: startWakeword,
    stop: stopWakeword,
  } = usePorcupine();

  const {
    transcript,
    listening: isRecording,
    resetTranscript,
  } = useSpeechRecognition();

  const [aiResponse, setAiResponse] = useState("");
  const [finalText, setFinalText] = useState("");
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("idle");
  
  // Use refs to maintain references across renders
  const wakewordRestartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ACCESS_KEY = "19o4VjDANhTicZmwkEZaouAEpxfO4x5njWS5AamiV9W76LbLOl0zOw==";
  const keywordPath = "/Hey-Cruz_en_wasm_v3_0_0.ppn";
  const modelPath = "/porcupine_params.pv";

  useEffect(() => {
    const porcupineKeyword = { publicPath: keywordPath, label: "Hey Cruz" };
    const porcupineModel = { publicPath: modelPath };

    const setupWakeword = async () => {
      try {
        await init(ACCESS_KEY, porcupineKeyword, porcupineModel);
        await startWakeword();
        console.log("🔊 Wakeword listening started automatically!");
        setStatus("listening for wakeword");
      } catch (error) {
        console.error("Error setting up wakeword:", error);
        setStatus("error initializing");
      }
    };

    setupWakeword();
    
    // Set up speech synthesis end event handler
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Test speech synthesis permission early
    testSpeechSynthesis();
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      // Clear any hanging timers on component unmount
      if (silenceTimer) clearTimeout(silenceTimer);
      if (wakewordRestartTimerRef.current) clearTimeout(wakewordRestartTimerRef.current);
    };
  }, []);

  // Test speech synthesis permission early
  const testSpeechSynthesis = () => {
    try {
      // Create a silent utterance to test permission
      const testUtterance = new SpeechSynthesisUtterance("");
      testUtterance.volume = 0; // Silent
      testUtterance.onend = () => {
        console.log("Speech synthesis permission test: allowed");
      };
      testUtterance.onerror = (e) => {
        if (e.error === "not-allowed") {
          console.warn("Speech synthesis permission test: not allowed");
          setStatus("speech permission denied");
        }
      };
      window.speechSynthesis.speak(testUtterance);
    } catch (error) {
      console.error("Speech synthesis test error:", error);
    }
  };

  const handleVoicesChanged = () => {
    console.log("Voices loaded:", window.speechSynthesis.getVoices().length);
  };

  useEffect(() => {
    if (keywordDetection) {
      console.log("🟢 Wake word detected:", keywordDetection.label);
      stopWakeword();
      setStatus("wake word detected");
      startRecording();
    }
  }, [keywordDetection]);

  useEffect(() => {
    if (isRecording) {
      if (silenceTimer) clearTimeout(silenceTimer);
      const timer = setTimeout(() => {
        console.log("⏹️ Silence detected. Stopping recording.");
        stopRecording();
      }, 3000);
      setSilenceTimer(timer as NodeJS.Timeout);
    }
  }, [transcript]);

  const startRecording = () => {
    setAiResponse("");
    resetTranscript();
    
    try {
      SpeechRecognition.startListening({ continuous: true });
      console.log("🎤 Started recording user query...");
      setStatus("recording");
    } catch (error) {
      console.error("Error starting recording:", error);
      setStatus("error recording");
      // If recording fails, restart wakeword detection
      startWakeword();
    }
  };

  const stopRecording = async () => {
    try {
      SpeechRecognition.stopListening();
      setStatus("processing");
      console.log("⏹️ Stopping recording... Waiting for final transcript...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const finalTranscript = transcript.trim();
      setFinalText(finalTranscript);
      console.log("✅ Final captured text:", finalTranscript);

      if (finalTranscript) {
        try {
          const aiReply = await getGeminiResponse(finalTranscript);
          
          setAiResponse(aiReply);
          console.log("🤖 Gemini says:", aiReply);
          await speak(aiReply);
        } catch (error) {
          console.error("Error getting AI response:", error);
          setStatus("error getting response");
        }
      } else {
        console.log("⚠️ No valid input captured.");
        setStatus("no input detected");
        restartWakewordDetection();
      }
    } catch (error) {
      console.error("Error in stopRecording:", error);
      restartWakewordDetection();
    }
  };
  
  const googleVoice = useGoogleVoice("Google US English");

  const speak = (text: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      // First check if speech synthesis is supported and allowed
      if (!window.speechSynthesis) {
        console.error("Speech synthesis not supported in this browser");
        setStatus("speech not supported");
        restartWakewordDetection();
        resolve();
        return;
      }

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to use Google voice if available
        if (googleVoice) {
          utterance.voice = googleVoice;
          console.log("Using Google voice:", googleVoice.name);
        } else {
          // Find the best US English voice as fallback
          const voices = window.speechSynthesis.getVoices();
          const usVoice = voices.find(voice => 
            voice.lang.includes('en-US') && voice.name.includes('Google'));
          
          if (usVoice) {
            utterance.voice = usVoice;
            console.log("Using fallback voice:", usVoice.name);
          } else {
            console.log("Using default voice");
          }
        }
        
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        setIsSpeaking(true);
        setStatus("speaking");
        
        // Setup a timeout in case the speech synthesis never completes or errors
        const speechTimeout = setTimeout(() => {
          console.warn("Speech synthesis timeout - forcing completion");
          setIsSpeaking(false);
          setStatus("speech timeout");
          restartWakewordDetection();
          resolve();
        }, 15000); // 15 second timeout
        
        utterance.onend = () => {
          console.log("Speech completed");
          clearTimeout(speechTimeout);
          setIsSpeaking(false);
          setStatus("response complete");
          restartWakewordDetection();
          resolve();
        };
        
        utterance.onerror = (e) => {
          console.error("Speech synthesis error:", e);
          clearTimeout(speechTimeout);
          setIsSpeaking(false);
          
          // Check for specific error types
          if (e.error === "not-allowed") {
            console.warn("Speech synthesis permission denied");
            setStatus("speech permission denied");
            
            // Display a fallback message to the user
            setAiResponse(prev => 
              prev + "\n\n(Speech output blocked. Please enable voice in your browser settings.)"
            );
          } else {
            setStatus(`speech error: ${e.error || "unknown"}`);
          }
          
          restartWakewordDetection();
          resolve();
        };
        
        // Use a try-catch when actually speaking
        try {
          window.speechSynthesis.speak(utterance);
        } catch (speakError) {
          console.error("Error during speech synthesis speak call:", speakError);
          clearTimeout(speechTimeout);
          setIsSpeaking(false);
          setStatus("speech API error");
          restartWakewordDetection();
          resolve();
        }
      } catch (setupError) {
        console.error("Error setting up speech synthesis:", setupError);
        setStatus("speech setup error");
        restartWakewordDetection();
        resolve();
      }
    });
  };
  
  const restartWakewordDetection = () => {
    // Clear any existing restart timer
    if (wakewordRestartTimerRef.current) {
      clearTimeout(wakewordRestartTimerRef.current);
    }
    
    // Add a small delay before restarting wakeword detection
    wakewordRestartTimerRef.current = setTimeout(() => {
      startWakeword();
      setStatus("listening for wakeword");
      console.log("🔄 Wakeword detection restarted");
      wakewordRestartTimerRef.current = null;
    }, 1000) as NodeJS.Timeout;
  };
  
  return (
    <div className="min-h-screen p-6 bg-muted text-foreground flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold">CruzLink AI Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Mic className={`h-6 w-6 ${isWakewordListening || isRecording ? "text-green-500" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status: {status}</span>
          {(isWakewordListening || isRecording || isSpeaking) && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-2 border-muted-foreground"></div>
          )}
        </div>
      </div>

      <Card className="w-full max-w-4xl mb-4">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-2">Live Transcript</h2>
          <div className="p-3 border rounded bg-background min-h-24">
            {isRecording ? (
              <p className="text-primary">{transcript || "Listening..."}</p>
            ) : (
              <p className={finalText ? "text-primary" : "text-muted-foreground"}>
                {finalText || "Say 'Hey Cruz' to start"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {aiResponse && (
        <Card className="w-full max-w-4xl bg-green-100 dark:bg-green-900 text-black dark:text-white">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">🤖 Cruz says:</h3>
            <p>{aiResponse}</p>
            {isSpeaking ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs">Speaking...</span>
                <div className="flex gap-1">
                  <div className="w-1 h-3 bg-current animate-pulse"></div>
                  <div className="w-1 h-4 bg-current animate-pulse delay-75"></div>
                  <div className="w-1 h-2 bg-current animate-pulse delay-150"></div>
                  <div className="w-1 h-5 bg-current animate-pulse delay-300"></div>
                </div>
              </div>
            ) : status.includes("permission denied") && (
              <div className="mt-2 bg-yellow-100 dark:bg-yellow-900 p-2 rounded text-sm">
                <p className="font-medium">Speech output blocked by browser</p>
                <Button 
                  size="sm" 
                  className="mt-1" 
                  onClick={() => {
                    testSpeechSynthesis();
                    speak("Testing voice permissions. If you can hear this, speech is now enabled.");
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <footer className="w-full max-w-4xl mt-auto pt-6 flex justify-end">
        <Battery className="text-muted-foreground" />
      </footer>
    </div>
  );
}
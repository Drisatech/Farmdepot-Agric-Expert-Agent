
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SUPPORTED_LANGUAGES, SYSTEM_INSTRUCTION, WEBSITE_URL, WELCOME_MESSAGE, CLOUD_FUNCTION_URL, APP_SECRET_KEY } from '../constants';
import { createBlob, decode, decodeAudioData } from '../services/audioUtils';
import VoiceButton from './VoiceButton';

interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ModelTypingIndicator = () => (
  <div className="flex flex-col gap-1 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
    <div className="flex gap-1.5 p-3.5 bg-white border border-primary/10 rounded-2xl w-20 justify-center shadow-lg items-center">
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"></div>
    </div>
    <span className="text-[9px] font-black text-secondary/70 uppercase ml-2 tracking-tighter">Mama is thinking...</span>
  </div>
);

const UserTypingIndicator = () => (
  <div className="flex flex-col items-end gap-1 mr-2 self-end animate-in fade-in slide-in-from-right-2 duration-300">
    <div className="flex gap-2.5 p-3 bg-primary/5 border border-primary/20 rounded-full w-fit px-6 justify-center shadow-sm items-center">
      <div className="flex gap-1 items-center">
        <div className="w-1 h-3 bg-primary/40 rounded-full animate-pulse"></div>
        <div className="w-1 h-5 bg-primary/60 rounded-full animate-pulse delay-75"></div>
        <div className="w-1 h-3 bg-primary/40 rounded-full animate-pulse delay-150"></div>
      </div>
      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Mama is listening...</span>
    </div>
  </div>
);

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onToggle }) => {
  const [isLive, setIsLive] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isModelTyping, setIsModelTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, image?: string }[]>([]);
  const [status, setStatus] = useState<string>('Ready');
  const [isMinimized, setIsMinimized] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('1');
  const [sessionId, setSessionId] = useState<string>(() => localStorage.getItem('farmdepot_session_id') || '');

  useEffect(() => {
    let sid = localStorage.getItem('farmdepot_session_id');
    if (!sid) {
      sid = crypto.randomUUID().replace(/-/g, '_');
      localStorage.setItem('farmdepot_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.parent.postMessage(isMinimized ? 'chat_minimized' : 'chat_maximized', "*");
    }
  }, [isMinimized, isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isModelTyping, isUserTyping, scrollToBottom]);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentOutputTranscriptionRef = useRef<string>('');
  const currentInputTranscriptionRef = useRef<string>('');
  const uploadedImageRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasGreetedRef = useRef<boolean>(false);

  const handleFunctionCall = useCallback(async (name: string, args: Record<string, unknown>) => {
    if (name === 'navigate_to_page') {
      const target = (args.target as string).toLowerCase();
      let path: string;
      if (target.includes('listing-form') || target.includes('sell') || target.includes('post')) {
        return `My sweet customer, I am ready to help you post your product right here! Just tell me what you want to sell.`;
      }
      
      if (target.includes('listings') || target.includes('market') || target.includes('buy')) path = '/listings/';
      else if (target.includes('category')) path = '/listing-category/';
      else if (target.includes('location')) path = '/listing-location/';
      else if (target.includes('account')) path = '/my-account/';
      else if (target.includes('about')) path = '/about-us/';
      else if (target.includes('contact')) path = '/contact-us/';
      else if (target.includes('blog') || target.includes('news')) path = '/blog/';
      else if (target.includes('checkout')) path = '/checkout';
      else if (target.includes('login')) path = '/login';
      else if (target.includes('faq')) path = '/faq';
      else path = '/listings/';

      window.open(`${WEBSITE_URL}${path}`, '_blank');
      return `Oya! Moving you to the page now. Better thing de there!`;
    }

    if (name === 'request_image_upload') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return "I have opened the camera and file picker for you, my customer! Please select the best photo of your product.";
    }

    if (name === 'submit_listing') {
      const activeSid = sessionId || localStorage.getItem('farmdepot_session_id');
      try {
        await fetch(CLOUD_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Secret': APP_SECRET_KEY
          },
          body: JSON.stringify({
            action: 'submit_listing',
            sessionId: activeSid,
            listingData: {
              ...args,
              image: uploadedImageRef.current,
              timestamp: new Date().toISOString()
            }
          })
        });
        uploadedImageRef.current = null;
        return "Oshey! I have sent your product details to the admin. It will be live very soon. You are a star!";
      } catch (e) {
        console.error("Listing submission failed", e);
        return "Mama's network is acting up, but don't worry, I will try to save it again. Try to confirm with me one more time!";
      }
    }

    return 'Action confirmed, my customer!';
  }, [sessionId]);

  const handleSendText = useCallback(async (e?: React.FormEvent, overrideMsg?: string, image?: string) => {
    if (e) e.preventDefault();
    const msg = overrideMsg || textInput;
    if (!msg.trim() && !image) return;
    
    const activeSid = sessionId || localStorage.getItem('farmdepot_session_id') || 'gen_' + Date.now();
    
    setMessages(prev => [...prev, { role: 'user', text: msg, image }]);
    if (!overrideMsg) setTextInput('');
    setIsModelTyping(true);

    try {
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Secret': APP_SECRET_KEY
        },
        body: JSON.stringify({
          action: 'chat',
          sessionId: activeSid,
          message: msg,
          image: image, // Send image to backend if needed
          history: messages.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          metadata: {
            systemInstruction: SYSTEM_INSTRUCTION,
            language: SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage)?.label
          }
        })
      });

      if (!response.ok) throw new Error("Backend connection failed");
      const data = await response.json();
      if (data.text) {
        if (data.text.startsWith('NAVIGATE:')) {
          const target = data.text.replace('NAVIGATE:', '');
          handleFunctionCall('navigate_to_page', { target });
        } else {
          setMessages(prev => [...prev, { role: 'model', text: data.text }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: "Oya, my network is small slow. Try again, sweet customer!" }]);
    } finally {
      setIsModelTyping(false);
    }
  }, [textInput, sessionId, messages, selectedLanguage, handleFunctionCall]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          uploadedImageRef.current = resizedBase64;
          handleSendText(undefined, `I have uploaded the photo for my ${file.name}. What is the next step, Mama?`, resizedBase64);
          if (fileInputRef.current) fileInputRef.current.value = '';
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, [handleSendText]);

  const logToBackend = useCallback(async (role: 'user' | 'model', text: string) => {
    const activeSid = sessionId || localStorage.getItem('farmdepot_session_id');
    if (!text || !activeSid) return;
    try {
      await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Secret': APP_SECRET_KEY
        },
        body: JSON.stringify({
          action: 'log',
          sessionId: activeSid,
          message: { role, text }
        })
      });
    } catch (e) {
      console.warn("Log sync failed", e);
    }
  }, [sessionId]);

  const stopSession = useCallback(async (shouldFinish = false) => {
    const activeSid = sessionId || localStorage.getItem('farmdepot_session_id');
    if (shouldFinish && activeSid) {
      try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Secret': APP_SECRET_KEY
          },
          body: JSON.stringify({
            action: 'finish_session',
            sessionId: activeSid
          })
        });
        const data = await response.json();
        if (data.email_status === 'sent') {
          setMessages(prev => [...prev, { role: 'model', text: "Oshey! I have sent the chat log to our team. We will follow up with you soon, my sweet customer!" }]);
        } else if (data.email_status === 'skipped') {
          console.warn("Email skipped:", data.reason);
        } else if (data.email_status === 'failed') {
          console.error("Email failed:", data.error);
        }
      } catch (e) {
        console.warn("Finish session call failed", e);
      }
    }

    if (sessionRef.current) {
      (sessionRef.current as { close: () => void }).close();
      sessionRef.current = null;
    }
    setIsLive(false);
    setIsModelSpeaking(false);
    setIsModelTyping(false);
    setIsUserTyping(false);
    setStatus('Ready');
    sourcesRef.current.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
    sourcesRef.current.clear();
  }, [sessionId]);

  const startSession = useCallback(async () => {
    if (isLive) return;
    try {
      const navigationFunctions: FunctionDeclaration[] = [
        {
          name: 'navigate_to_page',
          parameters: { 
            type: Type.OBJECT, 
            properties: { 
              target: { 
                type: Type.STRING, 
                description: "Target location name or intent" 
              } 
            }, 
            required: ['target'] 
          },
        },
        {
          name: 'request_image_upload',
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: 'submit_listing',
          parameters: {
            type: Type.OBJECT,
            properties: {
              listingType: { type: Type.STRING },
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              pricingType: { type: Type.STRING },
              priceType: { type: Type.STRING },
              priceAmount: { type: Type.STRING },
              unitPrice: { type: Type.STRING },
              condition: { type: Type.STRING },
              description: { type: Type.STRING },
              location: { type: Type.STRING },
              phoneNumber: { type: Type.STRING },
              whatsappNumber: { type: Type.STRING },
              promotionInterest: { type: Type.STRING },
              subscriptionStatus: { type: Type.STRING }
            },
            required: ['listingType', 'category', 'title', 'priceAmount', 'phoneNumber']
          }
        }
      ];

      setStatus('Connecting...');
      let apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || '').trim();
      
      // If the build-time key is missing or a placeholder, try fetching from the backend
      if (!apiKey || apiKey === 'undefined' || apiKey.length < 10 || apiKey === 'MY_GEMINI_API_KEY') {
        try {
          const res = await fetch('/api/config');
          if (res.ok) {
            const data = await res.json();
            if (data.apiKey && data.apiKey !== 'MY_GEMINI_API_KEY' && data.apiKey.length > 10) {
              apiKey = data.apiKey;
            } else {
              apiKey = ''; // Clear it if backend also returns a placeholder
            }
          } else {
            apiKey = ''; // Clear it if fetch failed
          }
        } catch (e) {
          console.error("Failed to fetch runtime config", e);
          apiKey = ''; // Clear it on error
        }
      }
      
      if (!apiKey) {
        console.error("Gemini API Key is missing or invalid. Please set GEMINI_API_KEY in Settings.");
        setStatus('API Key Missing');
        return;
      }

      // Configure the SDK to use our backend proxy for WebSockets in production
      const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('ais-dev');
      const baseUrl = isProduction ? `${window.location.protocol}//${window.location.host}/api-proxy/` : undefined;

      const ai = new GoogleGenAI({ apiKey, baseUrl });
      if (!inputAudioCtxRef.current) inputAudioCtxRef.current = new (window.AudioContext || (window as unknown as { AudioContext: typeof AudioContext }).AudioContext)({ sampleRate: 16000 });
      if (!outputAudioCtxRef.current) outputAudioCtxRef.current = new (window.AudioContext || (window as unknown as { AudioContext: typeof AudioContext }).AudioContext)({ sampleRate: 24000 });
      
      if (inputAudioCtxRef.current.state === 'suspended') await inputAudioCtxRef.current.resume();
      if (outputAudioCtxRef.current.state === 'suspended') await outputAudioCtxRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setStatus('Market Live');
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => { if (session) session.sendRealtimeInput({ media: createBlob(inputData) }); });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
            sessionPromise.then(session => {
              if (!hasGreetedRef.current) {
                session.sendRealtimeInput({ 
                  text: "INTERNAL STARTUP COMMAND: Introduce yourself briefly and say exactly: " + WELCOME_MESSAGE 
                });
                hasGreetedRef.current = true;
              } else {
                session.sendRealtimeInput({ 
                  text: "INTERNAL COMMAND: Connection restored. Continue where we left off without repeating greetings." 
                });
              }
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              setIsModelSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioCtxRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
              };
            }
            if (message.serverContent?.inputTranscription) {
              setIsUserTyping(true);
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'user') {
                  newMessages[newMessages.length - 1] = { role: 'user', text: currentInputTranscriptionRef.current };
                  return newMessages;
                }
                return [...prev, { role: 'user', text: currentInputTranscriptionRef.current }];
              });
            }
            if (message.serverContent?.outputTranscription) {
              setIsUserTyping(false);
              setIsModelTyping(true);
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                  newMessages[newMessages.length - 1] = { role: 'model', text: currentOutputTranscriptionRef.current };
                  return newMessages;
                }
                return [...prev, { role: 'model', text: currentOutputTranscriptionRef.current }];
              });
            }
            if (message.serverContent?.turnComplete) {
              logToBackend('user', currentInputTranscriptionRef.current);
              logToBackend('model', currentOutputTranscriptionRef.current);
              currentOutputTranscriptionRef.current = '';
              currentInputTranscriptionRef.current = '';
              setIsModelTyping(false);
              setIsUserTyping(false);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
              sourcesRef.current.clear();
              setIsModelSpeaking(false);
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = await handleFunctionCall(fc.name, fc.args);
                sessionPromise.then(session => { session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result } }] }); });
              }
            }
          },
          onerror: (err) => { 
            console.error("Live API Error:", err);
            setStatus('Error'); 
            stopSession(); 
          },
          onclose: (event) => { 
            console.log("Live API Closed:", event);
            setIsLive(false); 
            setStatus('Ended'); 
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: navigationFunctions }, { googleSearch: {} }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { 
      console.error("Start Session Error:", err);
      setStatus('Perms Needed'); 
    }
  }, [isLive, stopSession, handleFunctionCall, logToBackend]);

  const handleLanguageSelect = (id: string) => {
    setSelectedLanguage(id);
    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === id);
    handleSendText(undefined, `Please speak with me in ${langObj?.label} from now on.`); 
  };

  useEffect(() => { if (isOpen && !isLive) startSession(); }, [isOpen, isLive, startSession]);

  useEffect(() => {
    if (!isOpen) {
      stopSession(true);
      hasGreetedRef.current = false;
    }
  }, [isOpen, stopSession]);

  return (
    <div 
      className={`bg-white shadow-[0_35px_100px_-25px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 flex flex-col pointer-events-auto border border-gray-100/50
        ${isMinimized 
          ? 'w-72 h-16 rounded-[2rem]' 
          : 'w-[calc(100vw-1rem)] sm:w-[380px] md:w-[420px] h-[calc(100dvh-1.5rem)] sm:h-[600px] md:h-[750px] max-h-[calc(100dvh-2rem)] md:max-h-[850px] rounded-[1.5rem] sm:rounded-[2.5rem]'
        }`}
    >
      <div className="bg-primary p-4 sm:p-6 flex items-center justify-between text-white shrink-0 shadow-lg relative z-20">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <div className="h-10 sm:h-12 px-2 sm:px-4 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center shadow-inner shrink-0">
             <span className="text-primary font-black text-xs sm:text-sm tracking-tighter whitespace-nowrap uppercase italic">FarmDepot <span className="text-secondary">AI</span></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-lg sm:text-xl leading-none tracking-tight truncate">Mama FarmDepot</span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-white/30'}`}></span>
              <span className="text-[8px] sm:text-[9px] font-black opacity-90 uppercase tracking-[0.2em]">{isLive ? 'Active' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => { setMessages([]); stopSession(true); hasGreetedRef.current = false; }} className="text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all uppercase border border-white/5">Reset</button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-lg sm:rounded-xl transition-all font-black text-xl sm:text-2xl">{isMinimized ? '+' : '−'}</button>
          <button onClick={onToggle} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-white/10 rounded-lg sm:rounded-xl transition-all">✕</button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-start gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shadow-sm sticky top-0 z-10 shrink-0">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`text-[8px] sm:text-[9px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 transition-all font-black whitespace-nowrap uppercase tracking-widest ${selectedLanguage === lang.id ? 'bg-primary border-primary text-white shadow-lg scale-105' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-primary/20 hover:text-primary'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#fffdfd] space-y-4 sm:space-y-6 scroll-smooth">
            {messages.length === 0 && !isModelTyping && (
              <div className="flex flex-col items-center justify-center min-h-full gap-5 sm:gap-7 text-center px-4 sm:px-8 py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                  <div className="px-6 sm:px-8 py-4 sm:py-6 bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center relative z-10 border border-gray-50">
                    <span className="text-primary font-black text-xl sm:text-2xl tracking-tighter uppercase italic">FarmDepot <span className="text-secondary">AI</span></span>
                  </div>
                </div>
                <div>
                  <h3 className="text-primary font-black uppercase tracking-[0.3em] text-[9px] sm:text-[10px] mb-2 sm:mb-3">Welcome, my sweet customer!</h3>
                  <p className="text-[12px] sm:text-[13px] text-gray-400 font-bold leading-relaxed whitespace-pre-line text-left">{WELCOME_MESSAGE}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4 sm:gap-6">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[90%] p-3.5 sm:p-4.5 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-sm text-[12.5px] sm:text-[13.5px] font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-300 ${m.role === 'user' ? 'bg-primary text-white self-end rounded-tr-none shadow-primary/20' : 'bg-white text-gray-800 self-start border border-primary/5 rounded-tl-none ring-1 ring-gray-100'}`}>
                  {m.image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                      <img src={m.image} alt="Uploaded product" className="w-full h-auto max-h-48 object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  {m.text}
                </div>
              ))}
              {isUserTyping && <UserTypingIndicator />}
              {isModelTyping && <ModelTypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t bg-white space-y-4 sm:space-y-6 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] relative z-10 shrink-0">
            <form onSubmit={handleSendText} className="flex gap-2 sm:gap-4 items-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isModelTyping}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] sm:rounded-[1.5rem] bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all shrink-0 disabled:opacity-50"
                title="Upload Product Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isModelTyping}
                placeholder={isModelTyping ? "Mama is replying..." : "Talk to Mama FarmDepot..."}
                className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] sm:rounded-[1.8rem] px-4 sm:px-6 py-3 sm:py-4.5 text-xs sm:text-sm font-black focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-gray-300 shadow-inner disabled:opacity-50"
              />
              <button type="submit" disabled={isModelTyping || !textInput.trim()} className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] sm:rounded-[1.5rem] bg-primary flex items-center justify-center text-white hover:scale-105 shadow-xl sm:shadow-2xl shadow-primary/40 active:scale-95 transition-all group overflow-hidden relative shrink-0 disabled:grayscale disabled:scale-100">
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 rotate-90 relative z-10" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </form>
            <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-[0.25em] mb-1.5">Mama Status</div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-tight truncate ${isLive ? 'text-green-600' : 'text-gray-400'}`}>{status}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <button
                  onClick={() => stopSession(true)}
                  className="text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-2 sm:py-2.5 bg-secondary/10 text-secondary rounded-xl hover:bg-secondary/20 transition-all uppercase border border-secondary/10"
                  title="Finish Chat & Send Email"
                >
                  Finish
                </button>
                <VoiceButton isActive={isLive} isSpeaking={isModelSpeaking} onClick={isLive ? () => stopSession(false) : startSession} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;

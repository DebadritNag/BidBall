const synth = window.speechSynthesis;
let voices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (voicesPromise) {
        return voicesPromise;
    }
    voicesPromise = new Promise((resolve) => {
        if (typeof speechSynthesis === 'undefined') {
            resolve([]);
            return;
        }

        const loadVoices = () => {
            const voiceList = synth.getVoices();
            if (voiceList.length > 0) {
                voices = voiceList;
                resolve(voices);
            }
        };

        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
    });
    return voicesPromise;
}

// Pre-warm the voices cache when the module loads
getVoices();


export const speak = async (text: string) => {
  if (!synth || !text) {
    return;
  }

  // Cancel any previous speech to prevent overlap
  if (synth.speaking) {
    synth.cancel();
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.onend = () => {
    // console.log("Speech has finished.");
  };

  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    // Ignore 'interrupted' errors, as they are expected in a real-time auction.
    if (event.error === 'interrupted') {
      return;
    }
    console.error(
        "SpeechSynthesisUtterance.onerror - Error:", 
        event.error, 
        "Message:", 
        `"${event.utterance.text.substring(0, 100)}..."`
    );
  };
  
  // Wait for voices to be loaded to prevent errors
  const availableVoices = await getVoices();

  // Try to find a high-quality voice, with fallbacks
  if (availableVoices.length > 0) {
    const selectedVoice = availableVoices.find(voice => voice.name.includes('Google UK English Male')) || 
                        availableVoices.find(voice => voice.lang.startsWith('en') && voice.name.includes('Male')) || 
                        availableVoices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }
  
  utterance.pitch = 1.1;
  utterance.rate = 1.1;
  utterance.volume = 0.8;

  // A small delay to ensure the previous `cancel()` call has completed
  setTimeout(() => {
    synth.speak(utterance);
  }, 100);
};

export const cancelSpeech = () => {
    if (synth && synth.speaking) {
        synth.cancel();
    }
}
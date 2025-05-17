import requests
import json
import os
import playsound  # For playing audio (install: pip install playsound)
import speech_recognition as sr # Speech recognition (install: pip install SpeechRecognition)
import pyttsx3 # Alternative for cross-platform TTS if playsound has issues
from io import BytesIO  # Handle audio streaming from ElevenLabs
import tempfile  # Create temporary file for audio
import threading # For non-blocking audio playback

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")  # Get API key from environment variable
IPFS_VOICE_URL = "https://ipfs.io/ipfs/bafybeiczarcv4ccnfnba73i5pj3s3oe726sotl5ybmqnnmtx4ah7h4djri"  # Your IPFS URL
VOICE_NAME = "My Custom Voice"
VOICE_ID = None  # Store the voice ID once created

if not ELEVENLABS_API_KEY:
    print("Error: ElevenLabs API key not found in environment variables.")
    exit()

def create_custom_voice():
    """Downloads a voice sample, uploads it to ElevenLabs, and returns the voice ID."""
    global VOICE_ID  # Access the global variable
    try:
        # 1. Download the Voice Sample
        response = requests.get(IPFS_VOICE_URL)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        with open("voice_sample.mp3", "wb") as f:
            f.write(response.content)

        # 2. Upload to ElevenLabs and Create Custom Voice
        url = "https://api.elevenlabs.io/v1/voices/add"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "multipart/form-data",
        }
        files = {
            "files": ("voice_sample.mp3", open("voice_sample.mp3", "rb"), "audio/mpeg"),
            "name": (None, VOICE_NAME),
        }

        response = requests.post(url, headers=headers, files=files)
        response.raise_for_status()
        voice_data = response.json()
        if "voice_id" in voice_data:
            VOICE_ID = voice_data["voice_id"]
            print(f"Custom voice created with ID: {VOICE_ID}")
        else:
            print(f"Error creating voice: {voice_data}")
            exit()

        os.remove("voice_sample.mp3")  # Remove the temp file
        return VOICE_ID

    except requests.exceptions.RequestException as e:
        print(f"Error during request: {e}")
    except FileNotFoundError:
        print("Error: voice_sample.mp3 not found.")
    except json.JSONDecodeError:
        print("Error: Invalid JSON response from ElevenLabs API.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    return None  # Return None if voice creation fails

def text_to_speech(text, voice_id=None):
    """Converts text to speech using ElevenLabs API and plays the audio."""
    if voice_id is None:
        print("Error: No voice ID provided.")
        return

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "accept": "audio/mpeg",
    }
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5,
        },
    }

    try:
        response = requests.post(url, headers=headers, json=data, stream=True) # Stream the audio
        response.raise_for_status()

        # Play audio directly from stream
        play_audio_from_stream(response.content)


    except requests.exceptions.RequestException as e:
        print(f"Error during TTS request: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during TTS: {e}")


def play_audio_from_stream(audio_stream):
    """Plays audio directly from a byte stream using playsound."""
    try:
        # Create a temporary file to store the audio data
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=True) as tmpfile:
            tmpfile.write(audio_stream)
            tmpfile.flush()  # Ensure data is written to the file
            playsound.playsound(tmpfile.name, block=False)  # block=False for non-blocking playback
            #threading.Thread(target=playsound.playsound, args=(tmpfile.name,), kwargs={'block': False}).start()

    except playsound.PlaysoundException as e:
        print(f"Error playing audio with playsound: {e}")
        use_pyttsx3(audio_stream)  # Fallback to pyttsx3 if playsound fails
    except Exception as e:
        print(f"An unexpected error occurred during audio playback: {e}")


def use_pyttsx3(audio_stream):
    """Fallback function: Plays audio using pyttsx3 if playsound fails."""
    try:
        engine = pyttsx3.init()
        engine.save_to_file("Error with Playsound. Saving to file","alternative_tts.mp3")
        engine.runAndWait()

        with open("alternative_tts.mp3", "wb") as f:
            f.write(audio_stream)
            os.remove("alternative_tts.mp3")
    except Exception as e:
        print(f"Error playing audio with pyttsx3: {e}")

def listen():
    """Listens for user input using the microphone."""
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)  # Calibrate for noise
        audio = recognizer.listen(source)

    try:
        print("Recognizing...")
        query = recognizer.recognize_google(audio)
        print(f"User said: {query}\n")
        return query.lower()  # Convert to lowercase for easier handling
    except sr.UnknownValueError:
        print("Sorry, I could not understand.")
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return ""

def process_command(query):
    """Processes user commands."""
    if "hello" in query:
        text_to_speech("Hello! How can I help you?", voice_id=VOICE_ID)
    elif "what is the time" in query:
        import datetime
        now = datetime.datetime.now()
        text_to_speech(f"The time is {now.strftime('%I:%M %p')}", voice_id=VOICE_ID)
    elif "exit" in query or "quit" in query or "stop" in query:
        text_to_speech("Goodbye!", voice_id=VOICE_ID)
        return True  # Signal to exit the loop
    else:
        text_to_speech("I'm sorry, I don't understand that yet.", voice_id=VOICE_ID)
    return False  # Continue the loop

# Main Execution
if __name__ == "__main__":
    # 1. Create the custom voice (only needs to be done once)
    if not VOICE_ID:
        VOICE_ID = create_custom_voice()
        if not VOICE_ID:
            print("Failed to create custom voice. Exiting.")
            exit()

    # 2. Main Loop
    text_to_speech("Hello, I am your custom voice assistant. How can I help you today?", voice_id=VOICE_ID)
    while True:
        command = listen()
        if command:
            should_exit = process_command(command)
            if should_exit:
                break
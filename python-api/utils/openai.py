import os
from openai import OpenAI
from . import config
import io
import sys
import re
from pathlib import Path
from podcastfy.client import generate_podcast

os.environ['OPENAI_API_KEY'] = config.OPENAI_API_KEY
OpenAI.api_key = config.OPENAI_API_KEY 

client = OpenAI(api_key=config.OPENAI_API_KEY)

# FORMAT FOR USER PREFERENCES:
# user_preferences = {
#     "length": "short", # options: {"short", "medium", "long"}
#     "tone": "formal", # options: {"formal", "conversational", "technical", "analytical"}
#     "format": "highlights", # options: {"highlights", "bullets", "analysis", "quotes"}
#     "jargon_allowed": True # options: {True, False}
# }

# Summarizes an individual article based on user preferences
def generate_summary_individual(input_text, user_preferences):
    # model tuning parameters
    temperature = 0
    top_p = 0
    frequency_penalty = 0
    presence_penalty = 0
    max_tokens = 100

    # Customize prompt based on user preferences
    prompt = f"Summarize the following article with {user_preferences.get('length', 'short')} length, in a {user_preferences.get('tone', 'formal')} tone."
    if (user_preferences['format'] == 'bullets'):
      temperature = 0.2
      top_p = 0.5
      presence_penalty = 0.7
      prompt += " Format the response as a list of concise, bullet points that cover key content and understandings."
    elif (user_preferences['format'] == 'analysis'):
      temperature = 0.6
      top_p = 1
      frequency_penalty = 0.4
      prompt += " Format the response as a thoughtful analysis."
    elif (user_preferences['format'] == 'quotes'):
      temperature = 0.1
      top_p = 0.3
      frequency_penalty = 0
      prompt += " Format the response by extracting direct quotations from the articles provided."
    else: #default is highlight summary
      temperature = 0.4
      top_p = 0.7
      frequency_penalty = 0.3
      prompt += " Format the response as a highlight summary."

    if (not user_preferences.get('jargon_allowed', True)):
      prompt += " Use clear, simple language and avoid complicated jargon."
    prompt += f":\n\n{input_text}"

    if (user_preferences['length'] == 'medium'):
        max_tokens = 250
    elif (user_preferences['length'] == 'long'):
        max_tokens = 500
    
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"An error occurred: {str(e)}"

    return response.choices[0].message.content.strip()

# Summarizes multiple articles and gives an overview based on user preferences
def generate_summary_collection(input_text, user_preferences):

    temperature = 0
    top_p = 0
    frequency_penalty = 0
    presence_penalty = 0
    max_tokens = 100

    # Customize prompt based on user preferences
    # prompt = f"""
    # The provided articles are formatted as follows:

    # Each article begins with a title enclosed in triple hashtags (###), followed by its content. Articles are separated by two newlines. Example format:

    # ### Article Title 1 ###
    # Article content here.

    # ### Article Title 2 ###
    # Article content here.

    # Generate a concise, engaging title (5-10 words) summarizing the overall theme of the articles. 
    # Then, summarize the main topics and themes discussed across all of the provided articles in a cohesive manner, focusing on presenting the content directly and engagingly. Start the summary by directly addressing the topic without referencing the articles themselves. 
    
    # Ensure the summary aligns with {user_preferences.get('length', 'short')} length and maintains a {user_preferences.get('tone', 'formal')} tone.

    # Format your response as:

    # **Title**: [Generated Title]
    # **Summary**:
    # [Generated Summary]
    # """
    prompt = f"""
      The provided articles are formatted as follows:

      Each article begins with a title enclosed in triple hashtags (###), followed by its content. Articles are separated by two newlines. Example format:

      ### Article Title 1 ###
      Article content here.

      ### Article Title 2 ###
      Article content here.

      **Task:**
      1. Generate a concise, engaging title (4-8 words) that captures the overall theme of the provided articles. The title should be not be overly long or vague.
      2. Summarize the main topics and themes discussed across all the articles in a cohesive and engaging manner. The summary should be direct, informative, and engaging. Start the summary by directly addressing the topic without referencing the articles themselves.
      3. Ensure the summary aligns with the following user preferences:
        - **Length**: {user_preferences.get('length', 'short')}
        - **Tone**: {user_preferences.get('tone', 'formal')}

      **Formatting Requirement:**  
      Your response must follow this exact structure:
      **Title**: [Generated Title]
      **Summary**:
      [Generated Summary]
    """

    if (user_preferences['format'] == 'bullets'):
      temperature = 0.3
      top_p = 0.8
      presence_penalty = 0.7
      prompt += " Format the summary as a list of concise, bullet points that cover key content and understandings."
    elif (user_preferences['format'] == 'analysis'):
      temperature = 0.6
      top_p = 1
      frequency_penalty = 0.4
      prompt += " Format the summary as a thoughtful analysis."
    elif (user_preferences['format'] == 'quotes'):
      temperature = 0.1
      top_p = 0.6
      frequency_penalty = 0
      prompt += " Format the summary by extracting direct quotes from the articles provided, and then commenting on the quotes."
    else: #default is highlight summary
      temperature = 0.4
      top_p = 0.9
      frequency_penalty = 0.3
      prompt += " Format the summary as a highlight summary."

    if (not user_preferences.get('jargon_allowed', True)):
      prompt += " Use clear, simple language and avoid complicated jargon."
    prompt += f":\n\n{input_text}"
    
    
    # @ Sanya it may be clear to the GPT but I think we should have some sort of marker that divides articles (like some char/sequence) so GPT can easily distinguish between them
    # and if we implement this, we should mention it in prompt
    # ^^DONE (added more detail to prompt to specify input format)
    
    if (user_preferences['length'] == 'medium'):
        max_tokens = 250
    elif (user_preferences['length'] == 'long'):
        max_tokens = 500
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"An error occurred: {str(e)}"

    return response.choices[0].message.content.strip()

# Generates audio file based on given text using TTS
def generate_audio_from_article(text: str, filename: str = "text-to-speech.mp3"):
    
    audio_dir = Path(__file__).parent.parent / "data/tts"
    speech_file_path = audio_dir / filename
    response = client.audio.speech.create(
        model="tts-1",
        voice="echo",
        input=text,
    )
    response.stream_to_file(speech_file_path)
    return str(speech_file_path)


# Generates a podcast based on a collection of articles (URLs)
# Input: list of URLs of articles to be included in the podcast
# Output: paths to the generated audio file and transcript file
def generate_podcast_collection(links: [str]):
    PROJECT_ROOT = Path(__file__).parent.parent

    custom_config = {
      "conversation_style": ["formal", "engaging", "enthusiastic"],
      "podcast_name": "BiteWise",
      "podcast_tagline": "Your hub for personalized, digestible news",
      "creativity": 0,
      "text_to_speech": {"output_directories": 
        {
          "transcripts": str(PROJECT_ROOT / "data/podcasts/transcripts"),
          "audio": str(PROJECT_ROOT / "data/podcasts/audio")
        }
      }
    }

    stdout_backup = sys.stdout  # backup original stdout
    sys.stdout = io.StringIO()  # redirect to a StringIO object


    audio_path = generate_podcast(
        urls=links,
        llm_model_name="gpt-4o-mini",
        api_key_label="OPENAI_API_KEY",
        conversation_config=custom_config
    )

    # Get the captured output
    output = sys.stdout.getvalue()
    sys.stdout = stdout_backup 

    # Extract transcript path using regex
    match = re.search(r"Transcript saved to (.+)", output)
    transcript_path = match.group(1) if match else None


    return {"audio_file": audio_path, "transcript_file": transcript_path}

# Summarizes daily news articles
def daily_news_summary(input_text):
    temperature = 0
    top_p = 0
    frequency_penalty = 0
    presence_penalty = 0
    max_tokens = 100

    prompt = f"""
      The provided articles are formatted as follows:

      Each article begins with a title enclosed in triple hashtags (###), followed by its content. Articles are separated by two newlines. Example format:

      ### Article Title 1 ###
      Article content here.

      ### Article Title 2 ###
      Article content here.

      **Task:**
      Generate a 3-sentence overview of the key topics and themes discussed in the provided articles. Start the summary by overviewing all covered topics in the first sentence with an opening phrase such as "Today, we will cover...". The summary should:
      1. Be concise, engaging, and informative.
      2. Cover diverse topics from the articles rather than focusing on a single theme.
      3. Flow logically, ensuring smooth transitions between sentences.
      4. Avoid referencing specific articles, titles, or sources.
    """

    prompt += f":\n\n{input_text}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            # max_tokens=max_tokens ### removed max_tokens to allow for longer summaries for now
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"An error occurred: {str(e)}"

    return response.choices[0].message.content.strip()
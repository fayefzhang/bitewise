import os
from openai import OpenAI
from . import config
import io
import sys
import re
import textstat
from pathlib import Path
from podcastfy.client import generate_podcast
import boto3

os.environ['OPENAI_API_KEY'] = config.OPENAI_API_KEY
OpenAI.api_key = config.OPENAI_API_KEY 

S3_BUCKET = "bitewise-podcasts"
S3_REGION = "us-east-1"  
S3_BASE_URL = f"https://{S3_BUCKET}.s3.amazonaws.com"

client = OpenAI(api_key=config.OPENAI_API_KEY)

s3_client = boto3.client('s3', aws_access_key_id=config.AWS_ACCESS_KEY_ID, aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY, region_name=S3_REGION)

# FORMAT FOR USER PREFERENCES:
# user_preferences = {
#     "length": "short", # options: {"short", "medium", "long"}
#     "tone": "formal", # options: {"formal", "conversational", "technical", "analytical"}
#     "format": "highlights", # options: {"highlights", "bullets", "analysis", "quotes"}
#     "jargon_allowed": True # options: {True, False}
# }

def upload_to_s3(file_path, folder="podcasts"):
    file_name = file_path.split("/")[-1]
    s3_file_path = f"{folder}/{file_name}"
    try:
      s3_client.upload_file(file_path, S3_BUCKET, s3_file_path)
      return f"{S3_BASE_URL}/{s3_file_path}"
    except Exception as e: 
      return f"Error uploading to S3: {str(e)}"


# Summarizes an individual article based on user preferences
def generate_summary_individual(input_text, user_preferences):
    # model tuning parameters
    temperature = 0
    top_p = 0
    frequency_penalty = 0
    presence_penalty = 0
    max_tokens = 100

    fre_score = textstat.flesch_reading_ease(input_text)
    fkgl_score = textstat.flesch_kincaid_grade(input_text)
    readability_score = textstat.text_standard(input_text)

    summary_instruction = ""

    # Customize prompt based on user preferences
    if (user_preferences['format'] == 'bullets'):
      temperature = 0.2
      top_p = 0.5
      presence_penalty = 0.7
      summary_instruction = "Format the response as a list of concise, bullet points that cover key content and understandings."
    elif (user_preferences['format'] == 'analysis'):
      temperature = 0.6
      top_p = 1
      frequency_penalty = 0.4
      summary_instruction = "Format the response as a thoughtful analysis."
    elif (user_preferences['format'] == 'quotes'):
      temperature = 0.1
      top_p = 0.3
      frequency_penalty = 0
      summary_instruction = "Format the response by extracting direct quotations from the articles provided."
    else: #default is highlight summary
      temperature = 0.4
      top_p = 0.7
      frequency_penalty = 0.3
      summary_instruction = "Format the response as a highlight summary."

    if (not user_preferences.get('jargon_allowed', True)):
      summary_instruction += " Use clear, simple language and avoid complicated jargon."

    # if (user_preferences['length'] == 'medium'):
    #     max_tokens = 250
    # elif (user_preferences['length'] == 'long'):
    #     max_tokens = 500
    
    prompt = f"""
      Summarize the following article based on user preferences:
      - Length: {user_preferences.get('length', 'short')}
      - Tone: {user_preferences.get('tone', 'formal')}

      {summary_instruction}

      This article has the following readability metrics:
      - **Flesch Reading Ease Score**: {fre_score}
      - **Flesch-Kincaid Grade Level**: {fkgl_score}
      - **Initial Readability Classification**: {readability_score}

      Please follow these instructions:
      1️⃣ **Generate a structured summary** based on the user's selected format.
      2️⃣ **Verify and adjust the readability classification** based on the complexity of the text. 
        - Use the provided metrics as a guideline.
        - If the text has long sentences, advanced vocabulary, or technical terms, adjust accordingly.

      **Formatting Requirements:**
      Your response **must** follow this exact structure:
      ---
      **Summary**:
      [Generated summary]
      **Reading Difficulty**:
      [Easy/Medium/Hard]
      ---

      Article Content:
      {input_text}
    """
    
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            # max_tokens=max_tokens
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
    
    # if (user_preferences['length'] == 'medium'):
    #     max_tokens = 250
    # elif (user_preferences['length'] == 'long'):
    #     max_tokens = 500
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            # max_tokens=max_tokens
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

    # Upload podcast file to S3
    s3_url = upload_to_s3(audio_path) if audio_path else None

    return {"audio_file": audio_path, "transcript_file": transcript_path, "s3_url": s3_url}

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

# Filters out irrelevant articles using OpenAI
def filter_irrelevant_articles(articles, query):
    formatted_articles = "\n".join([f"{article['index']}: {article['text']}" for article in articles])

    prompt = f"""
    You are an intelligent news classifier. Your task is to filter out articles that do not make sense, based on the given search query, given their title or first sentence.

    Here is the search query:
    "{query}"

    Below is a list of articles with their index and a short description:

    {formatted_articles}

    Return a **comma-separated list** of the indices of articles that are relevant. Order the list based on relevancy to the original search query. Do not include any text, spaces, or additional characters.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
        )

        # Extracting the list of relevant indices from the response
        relevant_indices = response.choices[0].message.content.strip()

        # Convert the response from string to a list of integers
        return [int(idx) for idx in relevant_indices.split(",") if idx.strip().isdigit()]

    except Exception as e:
        return {"error": f"OpenAI API error: {str(e)}"}
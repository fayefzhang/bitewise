import os
from openai import OpenAI
from . import config

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
    prompt = f"Summarize the main topics and themes discussed across all of the provided articles in a cohesive manner, focusing on presenting the content directly and engagingly. Start the summary by directly addressing the topic without referencing the articles themselves. Ensure the summary aligns with {user_preferences.get('length', 'short')} length and maintains a {user_preferences.get('tone', 'formal')} tone."

    if (user_preferences['format'] == 'bullets'):
      temperature = 0.3
      top_p = 0.8
      presence_penalty = 0.7
      prompt += " Format the response as a list of concise, bullet points that cover key content and understandings."
    elif (user_preferences['format'] == 'analysis'):
      temperature = 0.6
      top_p = 1
      frequency_penalty = 0.4
      prompt += " Format the response as a thoughtful analysis."
    elif (user_preferences['format'] == 'quotes'):
      temperature = 0.1
      top_p = 0.6
      frequency_penalty = 0
      prompt += " Format the response by extracting direct quotes from the articles provided, and then commenting on the quotes."
    else: #default is highlight summary
      temperature = 0.4
      top_p = 0.9
      frequency_penalty = 0.3
      prompt += " Format the response as a highlight summary."

    if (not user_preferences.get('jargon_allowed', True)):
      prompt += " Use clear, simple language and avoid complicated jargon."
    prompt += f":\n\n{input_text}"
    # @ Sanya it may be clear to the GPT but I think we should have some sort of marker that divides articles (like some char/sequence) so GPT can easily distinguish between them
    # and if we implement this, we should mention it in prompt

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

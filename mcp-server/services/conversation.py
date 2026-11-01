conversation_history = {}


def get_conversation(conversation_id):
    return conversation_history.get(conversation_id, [])


def save_conversation(conversation_id, messages):
    conversation_history[conversation_id] = messages
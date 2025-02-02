from pydantic import BaseModel
from typing import List


class Option(BaseModel):
    text:str 
    is_correct: bool
class Question(BaseModel):
    question: str
    options: List[Option]

class Quiz(BaseModel):
    title: str
    questions: List[Question]


class FlashCard(BaseModel):
    front: str
    back: str
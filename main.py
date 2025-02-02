import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from groq import Groq
from langchain.vectorstores import Chroma
from io import BytesIO
import instructor
from typing import List
from pymongo import MongoClient
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware


from models import Question
from utils import *

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js app's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


# Initialize Groq Llama API
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
client = instructor.from_groq(client)

# MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL")
client_mongo = MongoClient(MONGO_URL)
db = client_mongo["quiz_app"]
users_collection = db["users"]
courses_collection = db["courses"]
quizzes_collection = db["quizzes"]
scores_collection = db["scores"]
flashcard_collection = db["flashcards"]

# Authentication
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=401, detail="Invalid credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = users_collection.find_one({"username": username})
    if not user:
        raise credentials_exception
    return user

# Authentication Endpoints
@app.post("/register/")
async def register(username: str, password: str):
    if users_collection.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(password)
    users_collection.insert_one({"username": username, "hashed_password": hashed_password})
    return {"msg": "User registered successfully"}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token({"sub": user["username"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

# Course Management
@app.post("/courses/")
async def add_course(course_name: str, current_user: dict = Depends(get_current_user)):
    if courses_collection.find_one({"name": course_name, "user_id": current_user["_id"]}):
        raise HTTPException(status_code=400, detail="Course already exists")
    course = {"name": course_name, "user_id": current_user["_id"], "created_at": datetime.utcnow()}
    result = courses_collection.insert_one(course)
    return {"msg": "Course added successfully", "course_id": str(result.inserted_id)}

@app.get("/courses/{course_id}")
async def get_course_details(course_id: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        quizzes = quizzes_collection.find({"course_id": course_id})
        quizzes_list = []
        total_score = 0
        score_count = 0

        for quiz in quizzes:
            quizzes_list.append({
                "_id": str(quiz["_id"]),
                "topic": quiz["topic"]
            })
            scores = scores_collection.find({"quiz_id": str(quiz["_id"])})
            for score in scores:
                total_score += score["score"]
                score_count += 1

        avg_score = total_score / score_count if score_count > 0 else 0

        course_details = {
            "_id": str(course["_id"]),
            "name": course["name"],
            "created_at": course["created_at"],
            "quizzes": quizzes_list,
            "number_of_quizzes": len(quizzes_list),
            "average_score": avg_score
        }

        return course_details

    except Exception as e:
        return {"error": str(e)}

@app.get("/courses/")
async def get_courses(current_user: dict = Depends(get_current_user)):
    courses = list(courses_collection.find({"user_id": current_user["_id"]}))
    return [{"_id": str(course["_id"]), "name": course["name"]} for course in courses]

@app.delete("/courses/{course_id}")
async def remove_course(course_id: str, current_user: dict = Depends(get_current_user)):
    result = courses_collection.delete_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    quizzes_collection.delete_many({"course_id": course_id})
    return {"msg": "Course and associated quizzes removed successfully"}

@app.put("/courses/{course_id}")
async def edit_course(course_id: str, new_name: str, current_user: dict = Depends(get_current_user)):
    result = courses_collection.update_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]}, {"$set": {"name": new_name}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"msg": "Course updated successfully"}

# Generate Quiz
@app.post("/courses/{course_id}/generate-quiz/")
async def generate_quiz_for_course(course_id: str, file: UploadFile = File(...), topic: str = "", num_questions: int = 5, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Load and process the file
        documents = load_course_files(file)
        chunks = split_documents(documents)
        course_name = file.filename

        # Check if embeddings exist
        if embeddings_exist(course_name):
            vector_db = Chroma(persist_directory="chroma_db")
        else:
            vector_db = store_embeddings(chunks, course_name)

        # Retrieve relevant content
        relevant_content = get_relevant_content(topic, vector_db)

        # Generate quiz
        quiz = generate_quiz(topic, relevant_content, num_topics=num_questions)

        # Convert quiz to a serializable format
        quiz_serializable = [q.dict() for q in quiz]

        # Store quiz in MongoDB
        quiz_data = {
            "course_id": str(course["_id"]),
            "user_id": str(current_user["_id"]),
            "topic": topic,
            "questions": quiz_serializable,
            "created_at": datetime.utcnow()
        }
        quizzes_collection.insert_one(quiz_data)

        return {"quiz": quiz_serializable}
    
    except Exception as e:
        return {"error": str(e)}
# Generate Flashcards
@app.post("/courses/{course_id}/generate-flashcards/")
async def generate_flashcards_for_course(course_id: str, file: UploadFile = File(...), topic: str = "", num_flashcards: int = 10, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Load and process the file
        documents = load_course_files(file)
        chunks = split_documents(documents)
        course_name = file.filename

        # Check if embeddings exist
        if embeddings_exist(course_name):
            vector_db = Chroma(persist_directory="chroma_db")
        else:
            vector_db = store_embeddings(chunks, course_name)

        # Retrieve relevant content
        relevant_content = get_relevant_content(topic, vector_db)

        # Generate flashcards
        flashcards = generate_flashcards(topic, relevant_content, num_topics=num_flashcards)

        # Convert flashcards to a serializable format
        flashcards_serializable = [f.dict() for f in flashcards]

        # Store flashcards in MongoDB
        flashcards_data = {
            "course_id": str(course["_id"]),
            "user_id": str(current_user["_id"]),
            "topic": topic,
            "flashcards": flashcards_serializable,
            "created_at": datetime.utcnow()
        }
        flashcard_collection.insert_one(flashcards_data)

        return {"flashcards": flashcards_serializable}
    
    except Exception as e:
        return {"error": str(e)}



@app.get("/quizzes/{quiz_id}/")
async def get_quiz_details(quiz_id: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        quiz = quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        quiz_details = {
            "topic": quiz["topic"],
            "questions": quiz["questions"]
        }

        return {"quiz": quiz_details}
    
    except Exception as e:
        return {"error": str(e)}

# Remove Quiz
@app.delete("/courses/{course_id}/quizzes/{quiz_id}/")
async def remove_quiz(course_id: str, quiz_id: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        result = quizzes_collection.delete_one({"_id": ObjectId(quiz_id), "course_id": course_id, "user_id": current_user["_id"]})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Quiz not found")

        return {"msg": "Quiz removed successfully"}
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/courses/{course_id}/quizzes/")
async def get_all_quizzes(course_id: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        quizzes = quizzes_collection.find({"course_id": course_id})
        quizzes_list = []
        for quiz in quizzes:
            score = scores_collection.find_one({"quiz_id": str(quiz["_id"]), "user_id": str(current_user["_id"])})
            if score:
                total_questions = len(quiz["questions"][0]["questions"])
                percentage_score = (score["score"] / total_questions) * 100
            else:
                percentage_score = None

            quizzes_list.append({
                "_id": str(quiz["_id"]),
                "course_id": str(quiz["course_id"]),
                "topic": quiz["topic"],
                "percentage_score": percentage_score
            })

        return {"quizzes": quizzes_list}
    
    except Exception as e:
        return {"error": str(e)}
@app.post("/quizzes/{quiz_id}/scores/")
async def submit_quiz_score(quiz_id: str, score: int, current_user: dict = Depends(get_current_user)):
    try:

        quiz = quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        score_data = {
            "quiz_id": quiz_id,
            "user_id": str(current_user["_id"]),
            "score": score,
            "submitted_at": datetime.utcnow()
        }
        scores_collection.insert_one(score_data)

        return {"msg": "Score submitted successfully"}
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/quizzes/{quiz_id}/scores/")
async def get_quiz_scores(quiz_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        # if not course:
        #     raise HTTPException(status_code=404, detail="Course not found")

        quiz = quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        scores = scores_collection.find({"quiz_id": quiz_id})
        scores_list = []
        for score in scores:
            scores_list.append({
                "_id": str(score["_id"]),
                "quiz_id": str(score["quiz_id"]),
                "user_id": str(score["user_id"]),
                "score": score["score"],
                "submitted_at": score["submitted_at"]
            })

        return {"scores": scores_list}
    
    except Exception as e:
        return {"error": str(e)}


@app.get("/courses/{course_id}/flashcards/topics/")
async def get_flashcard_topics(course_id: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        flashcards = flashcard_collection.find({"course_id": course_id})
        topics = set()
        for flashcard in flashcards:
            topics.add(flashcard["topic"])

        return {"topics": list(topics)}
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/courses/{course_id}/flashcards/{topic}/")
async def get_flashcards_by_topic(course_id: str, topic: str, current_user: dict = Depends(get_current_user)):
    try:
        course = courses_collection.find_one({"_id": ObjectId(course_id), "user_id": current_user["_id"]})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        flashcard_entry = flashcard_collection.find_one({"course_id": course_id, "topic": topic})
        if not flashcard_entry:
            raise HTTPException(status_code=404, detail="Flashcards not found for the given topic")

        flashcards_list = []
        for flashcard in flashcard_entry["flashcards"]:
            flashcards_list.append({
                "front": flashcard["front"],
                "back": flashcard["back"]
            })

        return {"flashcards": flashcards_list}
    
    except Exception as e:
        return {"error": str(e)}

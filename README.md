# AI-Powered Quiz and Flashcard App  

## Overview  
This project is an AI-powered quiz and flashcard application that helps users generate quizzes and flashcards from course materials. It allows users to upload documents, automatically extract key concepts, and generate interactive learning materials using a GPT-based AI model.  

## Features  

- **User Authentication**: Secure login and registration using JWT authentication  
- **Course Management**: Add, update, and delete courses  
- **AI-Powered Quiz Generation**: Generate quizzes from uploaded course materials  
- **Flashcard Generation**: Convert course material into question-answer format for quick revision  
- **Quiz Scoring and Tracking**: Keep track of scores and progress  
- **Database Storage**: Store user data, quizzes, and flashcards for future access  

## Tech Stack  

- **Backend**: FastAPI  
- **Frontend**: Next.js
- **Database**: MongoDB , ChromaDB  
- **AI Model**: GPT-based AI via the Groq API  
- **Authentication**: OAuth2 and JWT  

## Installation and Setup  

### 1. Clone the Repository  

### 2. Set Up a Virtual Environment  
It is recommended to use a virtual environment to manage dependencies.  

```bash
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
venv\Scripts\activate     # On Windows
```

### 3. Install Dependencies  
```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables  
Create a `.env` file in the project root directory and add the required credentials:  

```
MONGO_URL=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
SECRET_KEY=your_secret_key
```

### 5. Run the FastAPI Server  
Start the FastAPI backend using Uvicorn:  
```bash
uvicorn main:app --reload
```
This will run the server on `http://127.0.0.1:8000`  

## API Endpoints  

### Authentication  
- `POST /register/` - Register a new user  
- `POST /token` - Obtain an access token  

### Course Management  
- `POST /courses/` - Create a new course  
- `GET /courses/` - Retrieve all courses  
- `PUT /courses/{course_id}` - Update a course  
- `DELETE /courses/{course_id}` - Delete a course  

### Quiz Management  
- `POST /courses/{course_id}/generate-quiz/` - Generate a quiz using AI  
- `GET /courses/{course_id}/quizzes/` - Retrieve all quizzes for a course  
- `DELETE /courses/{course_id}/quizzes/{quiz_id}/` - Delete a quiz  

### Flashcard Management  
- `POST /courses/{course_id}/generate-flashcards/` - Generate flashcards from course material  

### Quiz Scores  
- `POST /quizzes/{quiz_id}/scores/` - Submit a quiz score  
- `GET /quizzes/{quiz_id}/scores/` - Retrieve quiz scores  

## Planned Features  
- AI-powered personalized learning recommendations  
- Gamification elements such as leaderboards and achievements  
- Voice-based quiz mode for hands-free learning  

## Contributing  
Contributions are welcome. If you find any issues or have feature requests, feel free to open an issue or submit a pull request.  

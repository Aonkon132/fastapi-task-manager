# 📋 TaskFlow - Modern Task Management Application

<div align="center">

![TaskFlow Logo](https://img.shields.io/badge/TaskFlow-Task%20Manager-purple?style=for-the-badge)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

**A beautiful, modern task management application with priority levels, categories, and dark mode support**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Security](#-security) • [API Docs](#-api-documentation)

</div>

---

## ✨ Features

### 🎨 Modern UI/UX
- **Stunning Design**: Vibrant gradients, smooth animations, and glassmorphism effects
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Responsive**: Mobile-friendly design that works on all devices
- **Micro-animations**: Smooth transitions and hover effects for enhanced UX

### 📊 Task Management
- **Priority Levels**: Four-tier system (Low, Medium, High, Urgent) with color coding
- **Categories**: Organize tasks by custom categories (Work, Personal, Study, etc.)
- **Due Dates**: Set deadlines with smart date formatting
- **Task Status**: Mark tasks as complete/incomplete
- **Timestamps**: Automatic creation and update tracking

### 🔐 Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for password storage
- **SQL Injection Protection**: ORM-based queries prevent injection attacks
- **XSS Protection**: Safe HTML rendering using textContent
- **CORS Configuration**: Restricted cross-origin access
- **Environment Variables**: Secure secret management

### 📈 Analytics
- **Real-time Statistics**: Live task counts and completion metrics
- **Filter System**: Quick filters by status and priority
- **Visual Indicators**: Priority badges and category tags

---


## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aonkon132/fastapi-task-manager.git
   cd fastapi-task-manager
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   # Generate a secure secret key
   openssl rand -hex 32
   
   # Create .env file
   echo "SECRET_KEY=your_generated_key_here" > .env
   echo "DATABASE_URL=sqlite:///database.db" >> .env
   echo "ENVIRONMENT=development" >> .env
   echo "ACCESS_TOKEN_EXPIRE_MINUTES=30" >> .env
   ```

5. **Run the application**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. **Open in browser**
   ```
   http://127.0.0.1:8000
   ```

---

## 📖 Usage

### Creating an Account

1. Navigate to http://127.0.0.1:8000
2. Click "Create one" to register
3. Enter username, email, and password
4. Click "Create Account"

### Managing Tasks

1. **Create Task**: Fill in the form and click "Add Task"
   - Enter task title
   - Select priority (Low/Medium/High/Urgent)
   - Add category (optional)
   - Set due date (optional)

2. **Complete Task**: Click the "✓ Done" button
3. **Edit Task**: Click "✏️ Edit", modify, and update
4. **Delete Task**: Click "🗑️ Delete"

### Filtering Tasks

- **All Tasks**: View all tasks
- **Pending**: Show incomplete tasks only
- **Completed**: Show completed tasks only
- **Urgent/High**: Filter by priority level

---

## 🏗️ Project Structure

```
taskflow/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application & CRUD endpoints
│   ├── auth.py              # Authentication routes
│   ├── security.py          # JWT & password utilities
│   ├── models.py            # SQLModel database models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # Database configuration
│   └── static/
│       ├── index.html       # Frontend HTML
│       ├── style.css        # Styling with dark mode
│       └── script.js        # Client-side JavaScript
├── .env                     # Environment variables (create this)
├── .gitignore
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🔒 Security

TaskFlow implements multiple security best practices:

### ✅ Implemented Security Features

- **Bcrypt Password Hashing**: Industry-standard password encryption
- **JWT Tokens**: Secure authentication with 30-minute expiration
- **SQL Injection Protection**: SQLModel ORM with parameterized queries
- **XSS Protection**: Safe DOM manipulation using textContent
- **CORS Configuration**: Restricted cross-origin requests
- **Environment Variables**: Secrets stored securely, never committed
- **Type Validation**: FastAPI enforces input types
- **Generic Error Messages**: Prevents account enumeration

### 🔍 Security Testing

The application has been tested against:
- ✅ SQL Injection attacks (6/6 tests passed)
- ✅ XSS vulnerabilities (fixed)
- ✅ Authentication bypass attempts (blocked)
- ✅ Account enumeration (prevented)



---

## 📚 API Documentation

### Interactive API Docs

Once the server is running, visit:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### Authentication Endpoints

#### Register User
```http
POST /auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=john_doe&password=securepassword123
```

### Task Endpoints

#### Get All Tasks
```http
GET /tasks/
Authorization: Bearer <your_jwt_token>
```

#### Create Task
```http
POST /tasks/
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "priority": "high",
  "category": "Work",
  "due_date": "2024-12-31T23:59:59"
}
```

#### Update Task
```http
PATCH /tasks/{task_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "is_completed": true
}
```

#### Delete Task
```http
DELETE /tasks/{task_id}
Authorization: Bearer <your_jwt_token>
```

#### Get Statistics
```http
GET /tasks/stats
Authorization: Bearer <your_jwt_token>
```

---

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLModel**: SQL databases in Python with type safety
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation using Python type hints
- **Passlib**: Password hashing library
- **Python-Jose**: JWT token handling
- **Python-Dotenv**: Environment variable management

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with animations and gradients
- **HTML5**: Semantic markup

### Database
- **SQLite**: Lightweight, serverless database

---

## 📦 Dependencies

```txt
fastapi==0.115.12
uvicorn[standard]==0.34.0
sqlmodel==0.0.22
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.20
python-dotenv==1.0.0
```

---

## 🚀 Deployment

### Production Checklist

Before deploying to production:

1. **Generate Production SECRET_KEY**
   ```bash
   openssl rand -hex 32
   ```

2. **Update CORS Origins**
   ```python
   # In app/main.py
   allow_origins=["https://yourdomain.com"]
   ```

3. **Enable HTTPS**
   - Use Let's Encrypt for free SSL certificates
   - Add HTTPS redirect middleware

4. **Set Environment Variables**
   ```bash
   export ENVIRONMENT=production
   export SECRET_KEY=<your_production_key>
   ```

5. **Use Production Database**
   - Consider PostgreSQL or MySQL for production
   - Update DATABASE_URL in .env

6. **Add Rate Limiting** (Optional but recommended)
   ```bash
   pip install slowapi
   ```

### Deployment Platforms

TaskFlow can be deployed on:
- **Heroku**: Easy deployment with Procfile
- **Railway**: Modern hosting platform
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2, Elastic Beanstalk, or Lambda
- **Vercel/Netlify**: Frontend + serverless backend

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 style guide
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure security best practices

---

## 🐛 Known Issues

- Edit functionality may require UI refresh in some cases
- Large task lists (>100 tasks) may need pagination

---

## 🔮 Future Enhancements

- [ ] Task search functionality
- [ ] Task attachments/files
- [ ] Task comments and notes
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Email notifications
- [ ] Export tasks (CSV, PDF)
- [ ] Team collaboration features
- [ ] Mobile apps (React Native)
- [ ] Integration with calendar apps

---

## 👨‍💻 Author

**Aonkon Mallick**
- GitHub: [@Aonkon132](https://github.com/Aonkon132)
- Email: aonkonmallick132@gmail.com

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the amazing web framework
- [SQLModel](https://sqlmodel.tiangolo.com/) for type-safe database interactions
- [Google Fonts](https://fonts.google.com/) for the Inter font family
- Icons from Unicode/Emoji

---

## 📞 Support

If you have any questions or issues, please:
1. Check existing [Issues](https://github.com/Aonkon132/fastapi-task-manager/issues)
2. Create a new issue with detailed description
3. Contact via email: aonkonmallick132@gmail.com

---

<div align="center">

**⭐ If you found this project helpful, please give it a star! ⭐**

Made with ❤️ using FastAPI

</div>

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from .database import get_session
from .schemas import UserCreate
from .models import User
from .security import hash_password
from fastapi.security import OAuth2PasswordRequestForm
from .security import verify_password, create_access_token
from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize limiter for auth routes
limiter = Limiter(key_func=get_remote_address)

# Create a router for authentication
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"] # This groups these routes in the API documentation
)

@router.post("/register/")
@limiter.limit("3/minute")
def register_user(request: Request, user_input: UserCreate, session: Session = Depends(get_session)):
    """
    Handles new user registration using a Schema (UserCreate).
    """
    
    # Convert username to lowercase for case-insensitive authentication
    username_lower = user_input.username.lower()
    
    # 1. Check if the username already exists (case-insensitive)
    statement_username = select(User).where(User.username == username_lower)
    if session.exec(statement_username).first():
        raise HTTPException(
            status_code=400, 
            detail="This username is already taken. Please choose another."
        )

    # 2. Check if the email already exists
    statement_email = select(User).where(User.email == user_input.email)
    if session.exec(statement_email).first():
        raise HTTPException(
            status_code=400, 
            detail="This email address is already registered."
        )

    # 2. Convert input data into the database model (User)
    # The plain password from user_input is hashed before saving for security
    # Username is stored in lowercase
    new_user = User(
        username=username_lower,
        email=user_input.email,
        hashed_password=hash_password(user_input.password) 
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return {
        "message": "User registered successfully", 
        "username": new_user.username
    }

# LOGIN ENDPOINT
@router.post("/token")
@limiter.limit("5/minute")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: Session = Depends(get_session)
):
    """
    Verifies user credentials and returns a JWT access token.
    """
    # 1. Look for the user in the database (case-insensitive)
    # Convert username to lowercase to match stored format
    username_lower = form_data.username.lower()
    user = session.exec(select(User).where(User.username == username_lower)).first()
    
    # 2. Verify password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401, 
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create JWT Token
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer"}













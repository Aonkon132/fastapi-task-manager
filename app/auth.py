from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .database import get_session
from .schemas import UserCreate
from .models import User
from .security import hash_password
from fastapi.security import OAuth2PasswordRequestForm
from .security import verify_password, create_access_token

# Create a router for authentication
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"] # This groups these routes in the API documentation
)

@router.post("/register/")
def register_user(user_input: UserCreate, session: Session = Depends(get_session)):
    """
    Handles new user registration using a Schema (UserCreate).
    """
    
    # 1. Check if the username already exists
    statement_username = select(User).where(User.username == user_input.username)
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
    new_user = User(
        username=user_input.username,
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
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    session: Session = Depends(get_session)
):
    """
    Verifies user credentials and returns a JWT access token.
    """
    # 1. Look for the user in the database
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    
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













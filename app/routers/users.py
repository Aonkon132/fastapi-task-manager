from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import Annotated
import shutil
import os
from ..database import get_session
from ..models import User
from ..schemas import UserRead, UserUpdate
from ..security import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# 1. Get Current User Profile
@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get the profile of the currently logged-in user.
    """
    return current_user

# 2. Update User Profile
@router.patch("/me", response_model=UserRead)
def update_user_profile(
    user_update: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update profile fields (full name, bio, job title, website) for the current user.
    """
    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

# 3. Upload Profile Picture
@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a profile picture. Images are converted to Base64 text and stored in the database.
    """
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are allowed.")
    
    # Read the file content
    contents = await file.read()
    
    # Convert to Base64
    import base64
    base64_encoded = base64.b64encode(contents).decode("utf-8")
    
    # Create Data URI (Text Format)
    # Format: data:[<mediatype>][;base64],<data>
    image_data_uri = f"data:{file.content_type};base64,{base64_encoded}"
    
    # Update user profile with the Base64 string
    current_user.profile_image = image_data_uri
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

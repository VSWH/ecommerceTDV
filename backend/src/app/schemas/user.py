from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    is_admin: bool = False
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str
    email: EmailStr
    password: str
    is_admin: bool = False
    is_active: bool = True


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
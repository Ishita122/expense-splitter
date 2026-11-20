from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import expenses, groups, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Splitter API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(groups.router)
app.include_router(expenses.router)

@app.get("/health")
def health():
    return {"status": "ok"}

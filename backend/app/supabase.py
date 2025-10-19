from supabase import create_client, Client
import os
from dotenv import load_dotenv
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from postgrest import SyncPostgrestClient

# Load environment variables

load_dotenv()


# Initialize Supabase client

SUPABASE_URL = os.getenv("SUPABASE_URL")
if SUPABASE_URL and not SUPABASE_URL.startswith("http"):
    SUPABASE_URL = "https://" + SUPABASE_URL
SUPABASE_API_KEY = os.getenv("SUPABASE_KEY")


supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)


POSTGREST_URL = SUPABASE_URL + "/rest/v1"
print(f"[DEBUG] POSTGREST_URL: {POSTGREST_URL}")
postgrest_client = SyncPostgrestClient(
    POSTGREST_URL,
    headers={
        "apikey": SUPABASE_API_KEY,
        "Authorization": f"Bearer {SUPABASE_API_KEY}"
    }
)
postgrest_client.session = httpx.Client(http2=False)

 # ...existing code...

# SQLAlchemy engine/session for direct Postgres access
POSTGRES_URL = os.getenv("POSTGRES_URL")
engine = create_async_engine(POSTGRES_URL, echo=False)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session


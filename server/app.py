"""
ScrivAI Backend Server
문서 편집기의 미디어 파일을 관리하는 FastAPI 서버
"""

import os
import shutil
import sqlite3
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# 설정
BASE_DIR = Path(__file__).parent
MEDIA_DIR = BASE_DIR / "media"
DB_PATH = BASE_DIR / "scrivai.db"

ALLOWED_EXTENSIONS = {
    # 이미지
    "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp",
    # 동영상
    "mp4", "webm", "avi", "mov", "mkv", "flv", "wmv",
    # 음성
    "mp3", "wav", "ogg", "m4a", "aac",
    # 문서
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"
}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


# media 디렉토리 생성
MEDIA_DIR.mkdir(exist_ok=True)


# 데이터베이스 초기화
def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

init_db()


# FastAPI 앱 초기화
app = FastAPI(
    title="ScrivAI Backend",
    description="문서 편집기 미디어 관리 및 프로젝트 저장 서버",
    version="1.1.0"
)


# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경: 모든 출처 허용 (프로덕션에서는 제한)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 정적 파일 제공 (media 디렉토리)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


# 응답/요청 모델
class UploadResponse(BaseModel):
    """파일 업로드 응답"""
    filename: str
    url: str
    size: int
    uploaded_at: str
    media_type: str


class MediaInfo(BaseModel):
    """미디어 파일 정보"""
    filename: str
    url: str
    size: int
    created_at: str

class ProjectData(BaseModel):
    """프로젝트 데이터"""
    id: str
    data: dict


# 유틸리티 함수
def get_file_extension(filename: str) -> str:
    """파일 확장자 추출"""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def is_allowed_file(filename: str) -> bool:
    """허용된 파일인지 확인"""
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


def generate_unique_filename(original_filename: str) -> str:
    """고유한 파일명 생성 (중복 방지)"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    name, ext = original_filename.rsplit(".", 1)
    return f"{name}_{timestamp}.{ext}"


# API 엔드포인트
@app.get("/")
async def root():
    """기본 엔드포인트"""
    return {
        "message": "ScrivAI Backend Server",
        "version": "1.1.0",
        "endpoints": {
            "upload": "/upload",
            "media": "/media/{filename}",
            "media_list": "/media-list",
            "projects_save": "/projects (POST)",
            "projects_load": "/projects/{project_id} (GET)",
            "delete": "/delete/{filename}",
            "cleanup": "/cleanup"
        }
    }


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    미디어 파일 업로드
    
    - **file**: 업로드할 미디어 파일
    - **반환**: 파일 정보 및 접근 URL
    """
    # 파일명 검증
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다")
    
    # 확장자 검증
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않는 파일 형식입니다. 허용 확장자: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    try:
        # 파일 크기 확인
        content = await file.read()
        file_size = len(content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일이 너무 큽니다. 최대 크기: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB"
            )
        
        # 고유 파일명 생성
        unique_filename = generate_unique_filename(file.filename)
        file_path = MEDIA_DIR / unique_filename
        
        # 파일 저장
        with open(file_path, "wb") as f:
            f.write(content)
        
        # URL 생성 (서버 호스트 포함 가능, 현재는 상대 경로)
        # 클라이언트에서 처리하거나 절대 경로 필요시 수정
        url = f"/media/{unique_filename}"
        
        # 응답 반환
        return UploadResponse(
            filename=unique_filename,
            url=url,
            size=file_size,
            uploaded_at=datetime.now().isoformat(),
            media_type=file.content_type or "application/octet-stream"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=f"파일 업로드 중 오류: {str(e)}")


@app.get("/media/{filename}")
async def get_media(filename: str):
    """
    미디어 파일 조회
    
    - **filename**: 조회할 파일명
    """
    file_path = MEDIA_DIR / filename
    
    # 경로 검증 (디렉토리 순회 공격 방지)
    try:
        file_path.resolve().relative_to(MEDIA_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="접근 불가능한 경로입니다")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    
    return FileResponse(file_path)


@app.get("/media-list", response_model=list[MediaInfo])
async def list_media():
    """
    저장된 모든 미디어 파일 목록 조회
    """
    media_list = []
    
    if not MEDIA_DIR.exists():
        return media_list
    
    for file_path in sorted(MEDIA_DIR.iterdir()):
        if file_path.is_file():
            stat = file_path.stat()
            media_list.append(
                MediaInfo(
                    filename=file_path.name,
                    url=f"/media/{file_path.name}",
                    size=stat.st_size,
                    created_at=datetime.fromtimestamp(stat.st_ctime).isoformat()
                )
            )
    
    return media_list


@app.delete("/delete/{filename}")
async def delete_media(filename: str):
    """
    미디어 파일 삭제
    
    - **filename**: 삭제할 파일명
    """
    file_path = MEDIA_DIR / filename
    
    # 경로 검증 (디렉토리 순회 공격 방지)
    try:
        file_path.resolve().relative_to(MEDIA_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="접근 불가능한 경로입니다")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    
    try:
        file_path.unlink()
        return {"message": f"파일 '{filename}'이 삭제되었습니다"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 삭제 중 오류: {str(e)}")


@app.post("/cleanup")
async def cleanup_media():
    """
    media 디렉토리의 모든 파일 삭제 (초기화)
    """
    try:
        if MEDIA_DIR.exists():
            shutil.rmtree(MEDIA_DIR)
            MEDIA_DIR.mkdir(exist_ok=True)
        
        return {"message": "media 디렉토리가 초기화되었습니다"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"정리 중 오류: {str(e)}")


# --- 프로젝트 저장/불러오기 API ---

@app.post("/projects")
async def save_project(project: ProjectData):
    """
    프로젝트 저장
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        updated_at = datetime.now().isoformat()
        
        # UPSERT 구현 (SQLite 3.24+ 지원)
        cursor.execute("""
            INSERT INTO projects (id, data, updated_at) 
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data=excluded.data,
                updated_at=excluded.updated_at
        """, (project.id, json.dumps(project.data), updated_at))
        
        conn.commit()
        conn.close()
        
        return {"message": "Project saved successfully", "id": project.id, "updated_at": updated_at}
    except Exception as e:
        logger.error(f"Project save error: {e}")
        raise HTTPException(status_code=500, detail=f"프로젝트 저장 실패: {str(e)}")


@app.get("/projects/{project_id}")
async def load_project(project_id: str):
    """
    프로젝트 불러오기
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT data, updated_at FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "id": project_id,
                "data": json.loads(row[0]),
                "updated_at": row[1]
            }
        else:
            raise HTTPException(status_code=404, detail="Project not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project load error: {e}")
        raise HTTPException(status_code=500, detail=f"프로젝트 불러오기 실패: {str(e)}")


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "media_dir_exists": MEDIA_DIR.exists(),
        "media_count": len(list(MEDIA_DIR.glob("*"))) if MEDIA_DIR.exists() else 0,
        "db_exists": DB_PATH.exists()
    }


if __name__ == "__main__":
    import uvicorn
    
    # 서버 실행
    uvicorn.run(
        "app:app",  # 문자열로 앱 지정 (reload 지원을 위해)
        host="0.0.0.0",
        port=8000,
        reload=True  # 개발 환경: 파일 변경시 자동 재로드
    )

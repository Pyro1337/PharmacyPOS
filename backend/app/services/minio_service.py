import io
import uuid
import os
from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException
from ..config import settings

_client = None

def get_minio_client():
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client

IMAGES_BUCKET = "pharmacy-images"

def ensure_bucket():
    client = get_minio_client()
    try:
        if not client.bucket_exists(IMAGES_BUCKET):
            client.make_bucket(IMAGES_BUCKET)
            # Make bucket publicly readable for images
            policy = f'''{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{IMAGES_BUCKET}/*"]
                }}]
            }}'''
            try:
                client.set_bucket_policy(IMAGES_BUCKET, policy)
            except Exception:
                pass
    except S3Error as e:
        # If minio not ready, ignore - will retry on upload
        print(f"MinIO bucket check failed: {e}")
    except Exception as e:
        print(f"MinIO ensure_bucket error: {e}")

def upload_image(file_data: bytes, content_type: str) -> str:
    ensure_bucket()
    client = get_minio_client()
    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    elif "jpeg" in content_type or "jpg" in content_type:
        ext = "jpg"
    # unique key
    key = f"{uuid.uuid4().hex}.{ext}"
    try:
        client.put_object(
            IMAGES_BUCKET,
            key,
            io.BytesIO(file_data),
            length=len(file_data),
            content_type=content_type
        )
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"Error subiendo imagen a MinIO: {e}")
    # Return public URL - use localhost for frontend
    # If endpoint is minio:9000 (internal), map to localhost:9000 for browser
    endpoint = settings.MINIO_ENDPOINT
    # external endpoint for browser
    public_host = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
    # If settings endpoint contains minio:9000, replace with public
    if "minio:" in endpoint:
        public_endpoint = public_host
    else:
        public_endpoint = endpoint
    protocol = "https" if settings.MINIO_SECURE else "http"
    url = f"{protocol}://{public_endpoint}/{IMAGES_BUCKET}/{key}"
    return url

def delete_image_by_url(url: str):
    # extract key from url
    try:
        key = url.split(f"/{IMAGES_BUCKET}/")[-1]
        if "?" in key:
            key = key.split("?")[0]
        client = get_minio_client()
        client.remove_object(IMAGES_BUCKET, key)
    except Exception:
        pass

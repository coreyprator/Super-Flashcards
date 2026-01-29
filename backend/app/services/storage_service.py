"""
Storage Service
Helpers for uploading/downloading files from Google Cloud Storage.
"""
import os
import re
from google.cloud import storage

BUCKET_NAME = os.getenv("CLOUD_STORAGE_BUCKET", "super-flashcards-media")


def _get_storage_client():
    return storage.Client()


def upload_to_gcs(content: bytes, blob_path: str, content_type: str = "application/octet-stream") -> str:
    """
    Upload bytes to GCS and return public URL.
    """
    client = _get_storage_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)
    blob.upload_from_string(content, content_type=content_type)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_path}"


def download_from_gcs(url: str) -> bytes:
    """
    Download bytes from a GCS URL (https://storage.googleapis.com/<bucket>/<path>)
    or gs://<bucket>/<path>.
    """
    if url.startswith("gs://"):
        _, _, bucket_name, blob_path = url.split("/", 3)
    else:
        match = re.match(r"https://storage.googleapis.com/([^/]+)/(.+)", url)
        if not match:
            raise ValueError("Invalid GCS URL")
        bucket_name, blob_path = match.groups()

    client = _get_storage_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    return blob.download_as_bytes()

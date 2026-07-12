FROM python:3.13-slim

WORKDIR /app

# Dependency sistem yang dibutuhkan opencv-python-headless / ultralytics.
# libgl1 wajib ada karena cv2 (dipanggil dari ultralytics) mencari libGL.so.1
# saat import, meskipun kita jalan headless tanpa display sama sekali.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# COPY di atas cuma menyalin pointer Xet/LFS untuk best.pt (bukan file
# binary aslinya — Docker build context HF Spaces tidak melakukan smudge
# LFS/Xet secara otomatis). Kita timpa manual dengan file asli, di-download
# langsung dari repo Space ini sendiri lewat huggingface_hub yang mengerti
# Xet secara native.
RUN python -c "\
from huggingface_hub import hf_hub_download; \
import shutil; \
path = hf_hub_download(repo_id='anggasspm/infravision-backend', repo_type='space', filename='app/ml_models/best.pt'); \
shutil.copy(path, '/app/app/ml_models/best.pt')"

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
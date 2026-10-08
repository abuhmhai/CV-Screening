FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 CACHE_DRIVER=file
WORKDIR /app
COPY apps/ai-service/requirements-local.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/ai-service/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

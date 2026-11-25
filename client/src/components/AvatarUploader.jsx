
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const inputRef = useRef(null);

  // Task 2: Validate the selected file.
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setUploadedUrl("");
    setProgress(0);

    if (!ALLOWED.includes(selectedFile.type)) {
      setFile(null);
      setError("Please select a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setError("File size must be 5 MB or less.");
      return;
    }

    setFile(selectedFile);
  }

  // Task 1: Drag-and-drop handlers.
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  // Task 3: Create preview and clean up its object URL.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Task 4: Upload using FormData and Axios progress.
  async function upload() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setProgress(0);
    setError("");
    setUploadedUrl("");

    try {
      const response = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round(
              (event.loaded * 100) / event.total
            );
            setProgress(percent);
          }
        },
      });

      setProgress(100);
      setUploadedUrl(
        response.data.url ||
        response.data.avatarUrl ||
        response.data.fileUrl ||
        ""
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag an image here, or click to choose</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="preview">
          <p>Selected file: {file.name}</p>
          {preview && (
            <img src={preview} alt="Selected avatar preview" />
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button onClick={upload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && (
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {progress === 100 && !uploading && (
        <p>Upload complete!</p>
      )}

      {uploadedUrl && (
        <p>
          Uploaded successfully: <a href={uploadedUrl} target="_blank" rel="noreferrer">View image</a>
        </p>
      )}
    </div>
  );
}

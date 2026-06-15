import { useState, useRef } from "react";
import { analyzeImage } from "../utils/api";

export default function CameraButton({ onResult, onLoading }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setAnalyzing(true);
    onLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await analyzeImage(formData);
      onResult(data); // { intent, cart, scene_description }
    } catch (err) {
      alert("Could not analyze image. Try a clearer photo.");
    } finally {
      setAnalyzing(false);
      setPreviewUrl(null);
      onLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <label
        className="p-3 rounded-full border-2 bg-white border-gray-200 text-gray-400
                   hover:border-blue-400 cursor-pointer transition-all flex-shrink-0
                   flex items-center justify-center"
        title="Take a photo of your situation"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        📷
      </label>

      {analyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-xl">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Scene"
                className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
              />
            )}
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">🔍 AI is reading the scene...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

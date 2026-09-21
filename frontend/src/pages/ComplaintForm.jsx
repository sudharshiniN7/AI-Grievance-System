import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ComplaintForm.css";

const TRANSPORT_MODES = ["Train", "Bus", "Metro", "Flight", "Ferry"];
const CATEGORIES = [
  "Delay",
  "Cleanliness",
  "Staff Behaviour",
  "Safety Concern",
  "Ticketing / Billing",
  "Other",
];

function ComplaintForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefilledCategory = location.state?.category || "";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    transportMode: "",
    routeFrom: "",
    routeTo: "",
    travelDate: "",
    location: "",
    category: prefilledCategory,
    description: "",
  });

  const [images, setImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const recognitionRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    const withPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...withPreviews]);
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome on desktop.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({
        ...prev,
        description: prev.description
          ? `${prev.description} ${transcript}`
          : transcript,
      }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Frontend only — no backend call. Placeholder submit behaviour for demo purposes.
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="card complaint-form-success">
        <span className="complaint-form-success-icon">✓</span>
        <h2>Complaint submitted successfully</h2>
        <p>
          Your complaint has been registered with reference ID{" "}
          <strong>GR-20492</strong>. Our AI system is now analysing and
          categorising it.
        </p>
        <div className="complaint-form-success-actions">
          <button className="btn btn-primary" onClick={() => navigate("/complaints/track")}>
            Track this Complaint
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Complaint Form</h1>
        <p>Fill in the details below as accurately as possible.</p>
      </div>

      <form className="card complaint-form" onSubmit={handleSubmit}>
        <section className="complaint-form-section">
          <h2>Passenger Details</h2>
          <div className="complaint-form-row">
            <div className="form-field">
              <label htmlFor="fullName">Passenger Name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="complaint-form-row complaint-form-row-2">
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        <section className="complaint-form-section">
          <h2>Journey Details</h2>
          <div className="complaint-form-row complaint-form-row-2">
            <div className="form-field">
              <label htmlFor="transportMode">Transport Mode</label>
              <select
                id="transportMode"
                name="transportMode"
                value={formData.transportMode}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select mode
                </option>
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="travelDate">Date of Journey</label>
              <input
                id="travelDate"
                name="travelDate"
                type="date"
                value={formData.travelDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="complaint-form-row complaint-form-row-2">
            <div className="form-field">
              <label htmlFor="routeFrom">From</label>
              <input
                id="routeFrom"
                name="routeFrom"
                type="text"
                placeholder="Origin station / stop"
                value={formData.routeFrom}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="routeTo">To</label>
              <input
                id="routeTo"
                name="routeTo"
                type="text"
                placeholder="Destination station / stop"
                value={formData.routeTo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="complaint-form-row">
            <div className="form-field">
              <label htmlFor="location">Location of Incident</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Platform 3, Coach S4, or bus stop name"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </section>

        <section className="complaint-form-section">
          <h2>Complaint Details</h2>
          <div className="complaint-form-row">
            <div className="form-field">
              <label htmlFor="category">Complaint Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="complaint-form-row">
            <div className="form-field">
              <div className="form-field-label-row">
                <label htmlFor="description">Complaint Description</label>
                <button
                  type="button"
                  className={
                    "voice-input-btn" + (isRecording ? " voice-input-btn-active" : "")
                  }
                  onClick={handleVoiceInput}
                >
                  {isRecording ? "● Listening…" : "🎤 Voice Input"}
                </button>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Describe what happened, when, and any other relevant details..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="complaint-form-row">
            <div className="form-field">
              <label htmlFor="images">Upload Images (optional)</label>
              <label htmlFor="images" className="image-upload-dropzone">
                <span>📷 Click to upload photos as evidence</span>
                <span className="image-upload-hint">PNG or JPG, up to 5MB each</span>
              </label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                hidden
              />

              {images.length > 0 && (
                <div className="image-upload-preview-grid">
                  {images.map((img, index) => (
                    <div className="image-upload-preview" key={img.name + index}>
                      <img src={img.url} alt={img.name} />
                      <button
                        type="button"
                        className="image-upload-remove"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove ${img.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="complaint-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}

export default ComplaintForm;
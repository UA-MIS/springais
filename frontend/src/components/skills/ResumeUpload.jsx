// Resume upload component with drag-and-drop
// Handles file upload and triggers skill extraction

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../../services/api';
import SkillExtractionPreview from './SkillExtractionPreview';
import { useSkillsContext } from '../../context/SkillsContext';

export default function ResumeUpload({ onSkillsExtracted, clearSkills, theme }) {
  // Get AI grouping function from context
  const { generateSkillGroupings } = useSkillsContext();
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedSkills, setExtractedSkills] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadedFile(file);
    setUploadStatus('uploading');

    try {
      // Create FormData and upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/skills/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Map backend response to frontend format
      const backendSkills = response.data?.skills || [];

      // Map proficiency levels to confidence scores
      const proficiencyToConfidence = {
        beginner: 0.25,
        intermediate: 0.50,
        advanced: 0.75,
        expert: 0.95,
      };

      const extractedSkillsList = backendSkills.map((skill) => ({
        name: skill.name || skill,
        category: skill.category || 'programming',
        confidence: proficiencyToConfidence[skill.proficiency] || 0.5,
        source: 'resume',
      }));

      const result = {
        success: true,
        extractedSkills: extractedSkillsList,
      };
      
      setUploadStatus('success');
      setExtractedSkills(result);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error extracting skills:', error);
      setUploadStatus('error');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const handleConfirmSkills = async (selectedSkills) => {
    // Clear existing skills before adding new ones from resume
    // This prevents old mock/bootstrap skills from persisting
    clearSkills?.();

    // Generate AI-powered skill groupings with personalized learning modules
    // Do this BEFORE notifying parent, so groupings exist when skills are refreshed
    const skillNames = selectedSkills.map(s => s.name);
    if (skillNames.length > 0 && generateSkillGroupings) {
      try {
        await generateSkillGroupings(skillNames);
      } catch (err) {
        console.error('Failed to generate skill groupings:', err);
      }
    }

    // Pass the skill names to parent so it can refresh properly
    onSkillsExtracted?.(skillNames);

    setIsPreviewOpen(false);
    setUploadStatus('idle');
    setUploadedFile(null);
    setExtractedSkills(null);
  };

  const handleCancelPreview = () => {
    setIsPreviewOpen(false);
    setUploadStatus('idle');
    setUploadedFile(null);
    setExtractedSkills(null);
  };

  const getBorderColor = () => {
    if (isDragActive) return theme?.cardHoverBorder || theme?.uploadHoverBorder || '#64748b';
    if (isHovered) return theme?.cardHoverBorder || theme?.uploadHoverBorder || '#64748b';
    return theme?.cardBorder || theme?.uploadBorder || '#cbd5e1';
  };

  return (
    <>
      <div
        {...getRootProps()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300"
        style={{
          borderColor: getBorderColor(),
          backgroundColor: theme?.cardBg || theme?.uploadBg || '#ffffff',
          opacity: uploadStatus === 'uploading' ? 0.5 : 1,
          boxShadow: isDragActive || isHovered ? (theme?.cardShadow || '0 4px 12px rgba(0,0,0,0.08)') : 'none',
        }}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'uploading' ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: theme?.textPrimary || theme?.categoryText || '#1e293b' }}
            />
            <p className="text-sm" style={{ color: theme?.textMuted || theme?.headerSubtext || '#64748b' }}>
              Extracting skills...
            </p>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: theme?.textPrimary || theme?.categoryText || '#1e293b' }}>
              {uploadedFile?.name}
            </p>
            <p className="text-xs" style={{ color: theme?.textMuted || theme?.headerSubtext || '#64748b' }}>
              Skills extracted successfully!
            </p>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-400">Upload failed. Please try again.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-10 h-10 transition-colors duration-200"
              style={{ color: isHovered ? (theme?.textPrimary || theme?.categoryText) : (theme?.textMuted || theme?.headerSubtext || '#64748b') }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: theme?.textPrimary || theme?.categoryText || '#1e293b' }}>
                {isDragActive ? 'Drop your resume here' : 'Upload Resume'}
              </p>
              <p className="text-xs" style={{ color: theme?.textMuted || theme?.headerSubtext || '#64748b' }}>
                Drag and drop or click to upload (PDF, DOCX, TXT)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Skill Extraction Preview Modal */}
      {isPreviewOpen && extractedSkills && (
        <SkillExtractionPreview
          extractedSkills={extractedSkills.extractedSkills}
          onConfirm={handleConfirmSkills}
          onCancel={handleCancelPreview}
        />
      )}
    </>
  );
}

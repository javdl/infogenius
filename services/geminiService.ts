/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ComplexityLevel, VisualStyle, ResearchResult, Language } from "../types";

// Helper to handle auth errors
const handleAuthError = (response: Response) => {
  if (response.status === 401) {
    // Session expired or not authenticated - redirect to login
    window.location.href = '/login';
    throw new Error('Session expired. Redirecting to login...');
  }
  if (response.status === 403) {
    throw new Error('Access restricted to @fashionunited.com email addresses');
  }
};

export const researchTopicForPrompt = async (
  topic: string,
  level: ComplexityLevel,
  style: VisualStyle,
  language: Language
): Promise<ResearchResult> => {
  const response = await fetch('/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, complexityLevel: level, visualStyle: style, language })
  });

  if (!response.ok) {
    handleAuthError(response);
    const error = await response.json().catch(() => ({ error: 'Research failed' }));
    throw new Error(error.error || 'Research failed');
  }

  return response.json();
};

export const generateInfographicImage = async (prompt: string): Promise<string> => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    handleAuthError(response);
    const error = await response.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(error.error || 'Image generation failed');
  }

  const data = await response.json();
  return data.imageData;
};

export const verifyInfographicAccuracy = async (
  imageBase64: string,
  topic: string,
  level: ComplexityLevel,
  style: VisualStyle,
  language: Language
): Promise<{ isAccurate: boolean; critique: string }> => {
  // Bypassing verification to send straight to image generation
  return {
    isAccurate: true,
    critique: "Verification bypassed."
  };
};

export const fixInfographicImage = async (currentImageBase64: string, correctionPrompt: string): Promise<string> => {
  // This function uses the same edit endpoint
  return editInfographicImage(currentImageBase64, correctionPrompt);
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const response = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: currentImageBase64, editInstruction })
  });

  if (!response.ok) {
    handleAuthError(response);
    const error = await response.json().catch(() => ({ error: 'Image editing failed' }));
    throw new Error(error.error || 'Image editing failed');
  }

  const data = await response.json();
  return data.imageData;
};

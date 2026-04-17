import { useEffect } from 'react';

interface DocumentMetaConfig {
  title: string;
  description: string;
}

function updateMetaTag(selector: string, attributeName: 'content', value: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const element = document.head.querySelector<HTMLMetaElement>(selector);

  if (element) {
    element.setAttribute(attributeName, value);
  }
}

export function useDocumentMeta({ title, description }: DocumentMetaConfig) {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = title;
    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
  }, [description, title]);
}

// @ts-nocheck
import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/hello`)
      .then((res) => res.text())
      .then((text) => setMessage(text))
      .catch((err) => setMessage('Error: ' + err.message));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>AI-Integrated LMS Platform</h1>
      <p>{message}</p>
      <p>This is the Next.js frontend talking to Azure Functions.</p>
    </div>
  );
} 
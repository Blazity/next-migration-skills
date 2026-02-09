'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = 'My App';
  }, []);

  return (
    <header>
      <nav>
        <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
        {isOpen && <ul><li onClick={() => router.push('/about')}>About</li></ul>}
      </nav>
    </header>
  );
}

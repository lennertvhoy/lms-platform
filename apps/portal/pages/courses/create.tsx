// @ts-nocheck
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { createCourse } from '../../services/api';
import { useRouter } from 'next/router';

export default function CreateCourse() {
  const { data: session } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!session) {
      return signIn();
    }
    const course = await createCourse({ title, description: desc });
    router.push(`/courses/${course.id}`);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Create Course</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
} 
// @ts-nocheck
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourses, Course } from '../../services/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading courses...</p>;

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Courses</h2>
      <Link href="/courses/create">
        <a style={{ marginBottom: '1rem', display: 'inline-block' }}>Create New Course</a>
      </Link>
      <ul>
        {courses.map((c) => (
          <li key={c.id} style={{ margin: '0.5rem 0' }}>
            <Link href={`/courses/${c.id}`}>
              <a>{c.title}</a>
            </Link>{' '}
            {c.isPublished ? '(Published)' : '(Draft)'}
          </li>
        ))}
      </ul>
    </div>
  );
} 
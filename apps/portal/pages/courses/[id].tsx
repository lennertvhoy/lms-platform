// @ts-nocheck
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCourse } from '../../services/api';

export default function CourseDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getCourse(Number(id))
      .then((data) => setCourse(data))
      .catch(() => router.push('/courses'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <h3>Modules</h3>
      <ul>
        {course.modules?.map((m) => (
          <li key={m.id}>{m.title}</li>
        ))}
      </ul>
    </div>
  );
} 
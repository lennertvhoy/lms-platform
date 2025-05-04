const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getHello(): Promise<string> {
  const res = await fetch(`${API_BASE}/hello`);
  return res.text();
}

export interface Course {
  id: number;
  title: string;
  isPublished: boolean;
}

export async function getCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/courses`);
  return res.json();
}

export async function getCourse(id: number) {
  const res = await fetch(`${API_BASE}/courses/${id}`);
  return res.json();
}

export async function createCourse(data: { title: string; description?: string }) {
  const res = await fetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
} 
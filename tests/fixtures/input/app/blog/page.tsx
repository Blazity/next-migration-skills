import { useRouter } from 'next/router';

export default function BlogPage() {
  const router = useRouter();
  return <div onClick={() => router.push('/home')}>Blog</div>;
}

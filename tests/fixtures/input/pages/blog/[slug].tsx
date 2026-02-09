import { useRouter } from 'next/router';

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  return { props: { slug: params.slug }, revalidate: 60 };
}

export default function BlogPost({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <article>
      <h1>{slug}</h1>
      <button onClick={() => router.back()}>Back</button>
    </article>
  );
}

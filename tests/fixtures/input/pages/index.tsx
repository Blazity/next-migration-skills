import Head from 'next/head';

export async function getStaticProps() {
  return { props: { title: 'Home' } };
}

export default function HomePage({ title }: { title: string }) {
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <h1>{title}</h1>
    </div>
  );
}

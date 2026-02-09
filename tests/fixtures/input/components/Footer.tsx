interface FooterProps {
  year: number;
  company: string;
}

export default function Footer({ year, company }: FooterProps) {
  return (
    <footer>
      <p>&copy; {year} {company}. All rights reserved.</p>
    </footer>
  );
}

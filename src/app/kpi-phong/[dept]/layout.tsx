import Layout from '@/components/Layout';

export default function DeptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}

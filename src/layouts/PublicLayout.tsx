import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Props {
  children: React.ReactNode;
  /** Render footer (default: true). Pass false for auth-flow or checkout pages where footer is not needed. */
  withFooter?: boolean;
}

export function PublicLayout({ children, withFooter = true }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      {withFooter && <Footer />}
    </div>
  );
}

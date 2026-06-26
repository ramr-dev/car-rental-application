import { Link } from "@tanstack/react-router";
import { Car, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground">
                <Car className="h-5 w-5" />
              </span>
              DriveLux
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Premium car rentals reimagined. From everyday sedans to dream supercars.
            </p>
            <div className="mt-6 flex gap-3">
              {[Twitter, Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Explore", links: [["Vehicles", "/vehicles"], ["Locations", "/locations"], ["Long-term", "/contact"], ["Business", "/host/register"]] },
            { title: "Company", links: [["About", "/about"], ["Press", "/about"], ["Partners", "/host/register"]] },
            { title: "Support", links: [["Help Center", "/help"], ["Contact", "/contact"], ["Insurance", "/insurance"], ["Terms", "/terms"]] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-3">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link to={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} DriveLux. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/privacy" className="hover:text-foreground">Cookies</Link>
            <Link to="/vehicles" className="hover:text-foreground">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

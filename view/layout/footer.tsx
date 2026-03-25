// view/layout/Footer.tsx
import Link from 'next/link';
import { FaTiktok, FaInstagram, FaEnvelope } from 'react-icons/fa';
import { siteConfig } from '@/config/site';
import Maxwidth from '@/components/Maxwidth';

export function Footer() {
  return (
    <footer className="border-t bg-background py-12 md:py-16">
      <Maxwidth className="">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 flex text-justify">
              {siteConfig.description}
            </p>
            <div className="flex space-x-4">
              <Link
                href={siteConfig.links.instagram}
                className="text-muted-foreground hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram className="h-5 w-5" />
              </Link>
              <Link
                href={siteConfig.links.tiktok}
                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                <FaTiktok className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <FaEnvelope  className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {siteConfig.links.email}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Maxwidth>
      <div className="w-full h-px bg-border my-12"></div>
      <Maxwidth className="">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </p>
      </Maxwidth>
    </footer>
  );
}

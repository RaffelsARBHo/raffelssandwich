// view/layout/Header.tsx
'use client';

import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { CartDrawer } from '@/view/cart/cart-drawer';
import { siteConfig } from '@/config/site';
import Maxwidth from '@/components/Maxwidth';
import Image from 'next/image';

export function Header() {
  const { cartCount, isCartOpen, setIsCartOpen } = useCart();  // ✅ Use from store

  return (
    <>
      <header className="top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Maxwidth className="flex h-24 items-center justify-between">
          {/* Left section - Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-semibold">
                    Menu
                  </Link>
                  <Link href="/orders" className="text-lg font-semibold">
                    Orders
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="Raffel's Sandwich"
                width={500}
                height={500}
                priority
                className="h-28 md:h-40 w-32 md:w-52"
              />
              <div className="leading-tight">
                {/* <div className="text-base sm:text-lg font-extrabold tracking-tight">
                  {siteConfig.name}
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground">
                  Fresh sandwiches • Indonesia
                </div> */}
              </div>
            </Link>
          </div>

          <div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:gap-6">
              <Link
                href="/"
                className="text-sm font-medium transition-colors hover:text-primary/95 hover:underline"
              >
                Menu
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium transition-colors hover:text-primary/95 hover:underline"
              >
                Orders
              </Link>
            </nav>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </Maxwidth>
      </header>

      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
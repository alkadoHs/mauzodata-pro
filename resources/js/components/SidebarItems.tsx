import { Home, ShoppingCart, Package, Users, LineChart } from 'lucide-react';
import { Badge } from './ui/badge';
import { Link } from '@inertiajs/react';

const SidebarItems = () => {
  return (
      <>
          <Link
              as="button"
              href={route("dashboard")}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
              <Home className="h-4 w-4" />
              Dashboard
          </Link>
          <Link
              as="button"
              href={route("orders.index")}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
              <ShoppingCart className="h-4 w-4" />
              Orders
              <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  6
              </Badge>
          </Link>
          <Link
              as="button"
              href={route("products.index")}
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
          >
              <Package className="h-4 w-4" />
              Products{" "}
          </Link>
          <Link
              as="button"
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
              <Users className="h-4 w-4" />
              Customers
          </Link>
          <Link
              as="button"
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
              <LineChart className="h-4 w-4" />
              Analytics
          </Link>
      </>
  );
}

export default SidebarItems
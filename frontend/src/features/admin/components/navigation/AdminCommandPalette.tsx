import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  TrendingUp,
  Users,
  Headphones,
  Settings,
  Search,
  FileText,
  CreditCard,
  User,
  Box,
} from "lucide-react";
import { ADMIN_ROUTES, ADMIN_NAV_ITEMS } from "../../constants";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  type: "user" | "drop" | "product" | "transaction";
  title: string;
  subtitle?: string;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Sparkles,
  Package,
  TrendingUp,
  Users,
  HeadphonesIcon: Headphones,
  Settings,
};

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Listen for keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setIsSearching(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search users
        const { data: users } = await supabase
          .from("collector_profiles")
          .select("user_id, username, display_name")
          .or(`username.ilike.%${debouncedQuery}%,display_name.ilike.%${debouncedQuery}%`)
          .limit(5);

        if (users) {
          users.forEach((user) => {
            searchResults.push({
              id: user.user_id,
              type: "user",
              title: user.display_name || user.username,
              subtitle: `@${user.username}`,
            });
          });
        }

        // Search drops/rooms
        const { data: drops } = await supabase
          .from("rooms")
          .select("id, tier, status, product_class_id")
          .or(`tier.ilike.%${debouncedQuery}%,status.ilike.%${debouncedQuery}%`)
          .limit(5);

        if (drops) {
          drops.forEach((drop) => {
            searchResults.push({
              id: drop.id,
              type: "drop",
              title: `${drop.tier} Drop`,
              subtitle: `Status: ${drop.status}`,
            });
          });
        }

        // Search products
        const { data: products } = await supabase
          .from("product_classes")
          .select("id, name, brand, category")
          .or(`name.ilike.%${debouncedQuery}%,brand.ilike.%${debouncedQuery}%`)
          .limit(5);

        if (products) {
          products.forEach((product) => {
            searchResults.push({
              id: product.id,
              type: "product",
              title: product.name,
              subtitle: `${product.brand} • ${product.category}`,
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchAll();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (type: string, id?: string) => {
      setOpen(false);
      setQuery("");

      switch (type) {
        case "nav":
          navigate(id!);
          break;
        case "user":
          navigate(`${ADMIN_ROUTES.USERS}/${id}`);
          break;
        case "drop":
          navigate(`${ADMIN_ROUTES.DROPS}/${id}`);
          break;
        case "product":
          navigate(`${ADMIN_ROUTES.INVENTORY}?product=${id}`);
          break;
        case "transaction":
          navigate(`${ADMIN_ROUTES.ECONOMY}?transaction=${id}`);
          break;
      }
    },
    [navigate]
  );

  const getResultIcon = (type: string) => {
    switch (type) {
      case "user":
        return User;
      case "drop":
        return Sparkles;
      case "product":
        return Box;
      case "transaction":
        return CreditCard;
      default:
        return FileText;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search users, drops, products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => handleSelect("nav", item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Search Results */}
        {results.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search Results">
              {results.map((result) => {
                const Icon = getResultIcon(result.type);
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type} ${result.title} ${result.subtitle || ""}`}
                    onSelect={() => handleSelect(result.type, result.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

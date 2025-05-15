import Link from "next/link"
import { cn } from "@/lib/utils"

interface MainNavProps {
  className?: string
  items: {
    title: string
    href: string
    description?: string
  }[]
}

export function MainNav({ className, items, ...props }: MainNavProps) {
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="text-sm font-medium transition-colors hover:text-primary">
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

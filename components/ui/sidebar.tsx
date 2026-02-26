"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SidebarContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
  isOpen: true,
  setIsOpen: () => {},
})

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="grid md:grid-cols-[auto_1fr]">{children}</div>
    </SidebarContext.Provider>
  )
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { isOpen, setIsOpen } = React.useContext(SidebarContext)

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

export function Sidebar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = React.useContext(SidebarContext)

  return (
    <aside
      className={cn(
        "border-r bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-0 md:w-16",
        className,
      )}
      {...props}
    >
      <div className={cn("h-full overflow-hidden", isOpen ? "opacity-100" : "opacity-0 md:opacity-100")}>
        {children}
      </div>
    </aside>
  )
}

export function SidebarHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = React.useContext(SidebarContext)

  return (
    <header
      className={cn(
        "flex h-14 items-center gap-2 border-b px-4",
        isOpen ? "justify-between" : "justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  )
}

export function SidebarContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-2", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarMenu({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarMenuItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  )
}

const sidebarMenuButtonVariants = cva(
  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "",
        active: "bg-accent text-accent-foreground",
      },
      size: {
        default: "h-9",
        sm: "h-8",
        lg: "h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  isActive?: boolean
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, variant, size, asChild = false, isActive, ...props }, ref) => {
    const { isOpen } = React.useContext(SidebarContext)
    const Comp = asChild ? React.Fragment : "button"
    const variantToUse = isActive ? "active" : variant

    return (
      <Comp
        {...(asChild
          ? {}
          : {
              className: cn(
                sidebarMenuButtonVariants({ variant: variantToUse, size }),
                isOpen ? "justify-start" : "justify-center",
                className,
              ),
              ref,
              ...props,
            })}
      >
        {asChild
          ? React.cloneElement(props.children as React.ReactElement, {
              className: cn(
                sidebarMenuButtonVariants({ variant: variantToUse, size }),
                isOpen ? "justify-start" : "justify-center",
                (props.children as React.ReactElement).props.className,
                className,
              ),
              ref,
              ...props,
            })
          : props.children}
      </Comp>
    )
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export function SidebarMenuSub({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = React.useContext(SidebarContext)

  if (!isOpen) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-1 pl-6", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarMenuSubItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {children}
    </div>
  )
}

export interface SidebarMenuSubButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  isActive?: boolean
}

export const SidebarMenuSubButton = React.forwardRef<HTMLButtonElement, SidebarMenuSubButtonProps>(
  ({ className, variant, size, asChild = false, isActive, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    const variantToUse = isActive ? "active" : variant

    return (
      <Comp
        {...(asChild
          ? {}
          : { className: cn(sidebarMenuButtonVariants({ variant: variantToUse, size }), className), ref, ...props })}
      >
        {asChild
          ? React.cloneElement(props.children as React.ReactElement, {
              className: cn(
                sidebarMenuButtonVariants({ variant: variantToUse, size }),
                (props.children as React.ReactElement).props.className,
                className,
              ),
              ref,
              ...props,
            })
          : props.children}
      </Comp>
    )
  },
)
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export function SidebarRail({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("absolute inset-y-0 right-0 w-px bg-border opacity-50", className)} {...props} />
}

export function SidebarInset({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      {children}
    </div>
  )
}

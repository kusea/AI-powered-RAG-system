import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuContent = ({ className, sideOffset = 4, ...props }:
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
            "z-50 min-w-32 overflow-hidden rounded-md border p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-white dark:bg-zinc-950",
            className
        )}
        {...props}
        />
    </DropdownMenuPrimitive.Portal>
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = ({ className, inset,...props}: 
    React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
}) => (
    <DropdownMenuPrimitive.Item
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
            inset && "pl-8",
            className
        )}
        {...props}
    />
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuLabel = ({className, inset, ...props}: 
    React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Label> & {inset?: boolean}) => (
        <DropdownMenuPrimitive.Label
            className = {cn("px-2 py-1.5 text-sm font-semibold",
                inset && "pl-8",
                className)}
            {...props}
        />
    )
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = ({
    className,
    ...props
}: React.ComponentPropsWithRef<typeof DropdownMenuPrimitive.Separator>) => (
    <DropdownMenuPrimitive.Separator
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
) 
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuLabel,
    DropdownMenuSeparator
}
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export interface MultiSelectOption {
    id: string
    label: string
}

interface MultiSearchSelectProps {
    options: MultiSelectOption[]
    selectedIds: string[]
    onValueChange: (ids: string[]) => void
    placeholder?: string
    emptyText?: string
    className?: string
}

export function MultiSearchSelect({
    options,
    selectedIds,
    onValueChange,
    placeholder = "Select options...",
    emptyText = "No results found.",
    className
}: MultiSearchSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (id: string) => {
        const newSelectedIds = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id]
        onValueChange(newSelectedIds)
    }

    const removeId = (id: string) => {
        onValueChange(selectedIds.filter(selectedId => selectedId !== id))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full h-auto min-h-[40px] justify-between bg-white dark:bg-slate-950 border-border/50 font-normal p-2", className)}
                >
                    <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
                        {selectedIds.length > 0 ? (
                            selectedIds.map(id => {
                                const option = options.find(o => o.id === id)
                                return (
                                    <Badge
                                        key={id}
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                                    >
                                        {option?.label.split(' (')[0] || id}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    removeId(id)
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                removeId(id)
                                            }}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground pl-1">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command className="w-full">
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.label}
                                    onSelect={() => handleSelect(option.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Checkbox
                                            checked={selectedIds.includes(option.id)}
                                            className="pointer-events-none"
                                        />
                                        <span className="flex-1 truncate">{option.label}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

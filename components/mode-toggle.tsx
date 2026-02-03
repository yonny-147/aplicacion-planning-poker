"use client"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { SystemIcon } from "./icons/system-icon"

export function ModeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)


    useEffect(() => {
        setMounted(true)
    }, [])

    const cycleTheme = () => {
        if (theme === "system") {
            setTheme("light")
        } else if (theme === "light") {
            setTheme("dark")
        } else {
            setTheme("system")
        }
    }


    if (!mounted) {
        return (
            <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
                <span className="sr-only">Cambiar tema</span>
            </Button>
        )
    }

    return (
        <Button variant="outline" size="icon" onClick={cycleTheme} className="shadow-xs cursor-pointer">
            {theme === "light" && (
                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
            )}
            {theme === "dark" && (
                <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
            )}
            {theme === "system" && (
                <SystemIcon />
            )}
            <span className="sr-only">Cambiar tema (actual: {theme})</span>
        </Button>
    )
}

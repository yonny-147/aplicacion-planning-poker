import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { LogOut, Trash2Icon } from "lucide-react"

export function AlertDialogDestructive({ action, description, title, triggerText, buttonText }: { action: () => void, description: string, title: string, triggerText: string, buttonText: string }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"

                    className="w-full bg-transparent !border-destructive cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                    size="sm"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {buttonText}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent size="default">
                <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
                        <Trash2Icon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel variant="outline">Cancelar</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={action}>{triggerText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

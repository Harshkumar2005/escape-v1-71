
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "hidden group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground hidden",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hidden",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground hidden",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

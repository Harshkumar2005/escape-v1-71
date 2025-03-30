
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-sidebar group-[.toaster]:text-sidebar-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-sidebar-foreground/80",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          background: 'rgb(26, 30, 38)',
          border: '1px solid rgba(39, 43, 51, 0.5)',
          color: 'rgb(214, 221, 235)'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }

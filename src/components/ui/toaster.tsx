
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useIsMobile } from "@/hooks/use-mobile"

export function Toaster() {
  const { toasts } = useToast()
  const isMobile = useIsMobile()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className={isMobile ? "max-w-[280px] p-3 pr-6 pointer-events-auto" : "pointer-events-auto"}
          >
            <div className={`flex items-start gap-2 ${isMobile ? "gap-2" : "gap-3"}`}>
              {icon && <div className={`flex-shrink-0 text-brand-600 ${isMobile ? "scale-75" : ""}`}>{icon}</div>}
              <div className="grid gap-1">
                {title && <ToastTitle className={isMobile ? "text-xs" : ""}>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className={isMobile ? "text-xs" : ""}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className={isMobile ? "scale-75 right-1 top-1" : ""} />
          </Toast>
        )
      })}
      <ToastViewport 
        // Modificado para impedir que notificações interfiram com modais
        className={isMobile 
          ? "fixed max-w-[300px] p-2 bottom-[80px] right-0 z-50 pointer-events-none" 
          : "fixed z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none"
        } 
      />
    </ToastProvider>
  )
}
